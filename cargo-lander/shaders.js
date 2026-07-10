class ShaderOverlay {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        this.initShaders();
        this.initBuffers();
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.gl) this.gl.viewport(0, 0, w, h);
    }

    initShaders() {
        if (!this.gl) return;
        const gl = this.gl;

        // Particle Shader (Point Sprites)
        const vsParticleSource = `
            attribute vec2 a_position;
            attribute vec4 a_color;
            attribute float a_size;
            
            uniform vec2 u_resolution;
            uniform vec2 u_cameraPos;
            uniform float u_zoom;
            
            varying vec4 v_color;
            
            void main() {
                // Apply camera transform
                vec2 pos = (a_position - u_cameraPos) * u_zoom + (u_resolution / 2.0);
                
                // Convert to clip space
                vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
                
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                gl_PointSize = a_size * u_zoom;
                v_color = a_color;
            }
        `;

        const fsParticleSource = `
            precision mediump float;
            varying vec4 v_color;
            
            void main() {
                // Calculate distance from center of point
                vec2 pt = gl_PointCoord - vec2(0.5);
                float dist = length(pt);
                
                if (dist > 0.5) {
                    discard;
                }
                
                // Soft edge
                float alpha = (0.5 - dist) * 2.0;
                
                gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
            }
        `;

        this.particleProgram = this.createProgram(vsParticleSource, fsParticleSource);

        // Monster Shader (Quad)
        const vsMonsterSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0, 1);
            }
        `;

        const fsMonsterSource = `
            precision mediump float;
            varying vec2 v_uv;
            
            uniform vec2 u_resolution;
            uniform vec2 u_monsterPos;
            uniform float u_monsterSize;
            uniform vec2 u_cameraPos;
            uniform float u_zoom;
            uniform float u_time;
            
            // Simple 2D noise function
            float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
            float noise(vec2 x) {
                vec2 i = floor(x);
                vec2 f = fract(x);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                // Screen coordinate to world coordinate
                vec2 screenPos = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
                vec2 worldPos = (screenPos - (u_resolution / 2.0)) / u_zoom + u_cameraPos;
                
                vec2 diff = worldPos - u_monsterPos;
                float dist = length(diff);
                
                // Base monster radius
                float baseRadius = u_monsterSize * 0.5;
                
                // Add writhing noise
                float angle = atan(diff.y, diff.x);
                float n = noise(vec2(angle * 5.0, u_time * 2.0));
                float n2 = noise(vec2(dist * 0.05 - u_time * 5.0, angle * 3.0));
                
                float radius = baseRadius + (n * 30.0) + (n2 * 40.0);
                
                if (dist < radius) {
                    float core = 1.0 - (dist / radius);
                    // Dark center, glowing red edges
                    vec3 color = mix(vec3(0.1, 0.0, 0.0), vec3(0.9, 0.1, 0.1), pow(1.0 - core, 2.0));
                    gl_FragColor = vec4(color, core + 0.2);
                } else {
                    gl_FragColor = vec4(0.0);
                }
            }
        `;

        this.monsterProgram = this.createProgram(vsMonsterSource, fsMonsterSource);

        // Gravity Well Shader (Quad)
        const vsGravityWellSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0, 1);
            }
        `;

        const fsGravityWellSource = `
            precision mediump float;
            varying vec2 v_uv;
            
            uniform vec2 u_resolution;
            uniform vec2 u_wellPos;
            uniform float u_wellRadius;
            uniform float u_wellPulse;
            uniform vec2 u_cameraPos;
            uniform float u_zoom;
            uniform float u_time;
            
            void main() {
                vec2 screenPos = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
                vec2 worldPos = (screenPos - (u_resolution / 2.0)) / u_zoom + u_cameraPos;
                
                vec2 diff = worldPos - u_wellPos;
                float dist = length(diff);
                
                if (dist > u_wellRadius) {
                    gl_FragColor = vec4(0.0);
                    return;
                }
                
                float normDist = dist / u_wellRadius;
                // Black hole event horizon
                float eventHorizon = 20.0;
                
                if (dist < eventHorizon) {
                    // Pure black core
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }
                
                // Swirling accretion disk
                float angle = atan(diff.y, diff.x);
                float swirl = sin(angle * 3.0 + u_time * 2.0 - normDist * 10.0);
                
                // Pulsing glow — kept calmer than the original 0.5+0.5*swirl range,
                // which read as a distracting bright pulse rather than ambience.
                float pulse = u_wellPulse;

                float intensity = (1.0 - normDist) * (0.32 + 0.28 * swirl) * pulse * 0.7;
                
                // Purple/black lensing effect
                vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(0.6, 0.2, 0.9), intensity);
                
                gl_FragColor = vec4(color, intensity * (1.0 - normDist));
            }
        `;

        this.gravityWellProgram = this.createProgram(vsGravityWellSource, fsGravityWellSource);

        // Post-processing distortion pass — samples the already-drawn Canvas2D
        // scene as a texture and re-draws a warped version of it wherever an
        // effect region is active (heat haze / water shimmer / gravity lensing),
        // leaving everything else fully transparent so the untouched scene shows
        // through unmodified. See renderPostFX() for how this gets driven.
        const vsPostFXSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0, 1);
            }
        `;

        const fsPostFXSource = `
            precision mediump float;
            varying vec2 v_uv;

            uniform sampler2D u_sceneTex;
            uniform vec2 u_resolution;
            uniform float u_time;

            uniform float u_heatHazeEnabled;

            uniform int u_waterCount;
            uniform vec2 u_waterMin[4];
            uniform vec2 u_waterMax[4];

            uniform float u_blackholeEnabled;
            uniform vec2 u_blackholePos;
            uniform float u_blackholeRadius;

            uniform float u_rainAmount;

            float hash21(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            // "Raindrops on a camera lens", redesigned 2026-07-10 (v3) from a
            // reference photo of rain on a car window: each drop is a small
            // lens (gentle magnification, not a strong porthole-style pull),
            // with a tiny specular glint near its upper-left edge, and about
            // 40% of drops trail a thin, tapering trickle beneath them. v1/v2
            // (round beads, then vertically-stretched beads) both read as
            // "not great" / flat per playtest — the missing ingredients were
            // the highlight glint and the trickle trail, which are what read
            // as "wet glass" in the reference rather than "smudged dots".
            // Explicitly kept far more sparse/faint than the reference photo
            // (a heavy-rain windshield close-up) per direct user feedback
            // that it needs to be "way more subtle" — this is a gameplay
            // overlay the player has to see through, not a screenshot.
            // Returns: xy = refraction offset, z = body alpha, w = glint alpha.
            vec4 droplet(vec2 sp, float cellSize, float rad, float seed) {
                vec2 baseCell = floor(sp / cellSize);
                vec4 bestResult = vec4(0.0);
                
                for(int y = -1; y <= 1; y++) {
                    for(int x = -1; x <= 1; x++) {
                        vec2 cell = baseCell + vec2(float(x), float(y));
                        float h1 = hash21(cell + seed);
                        float h2 = hash21(cell + seed + 31.7);
                        float h3 = hash21(cell + seed + 57.3);
                        if (h3 > 0.90) continue; // most cells stay empty — sparse field

                        float yFrac = fract(h2 + u_time * (0.009 + 0.022 * h1));
                        vec2 center = (cell + vec2(0.2 + 0.6 * h1, yFrac)) * cellSize;
                        float r = rad * (0.6 + 0.7 * h2);

                        vec4 result = vec4(0.0);

                        vec2 d = sp - center;
                        vec2 dn = vec2(d.x, d.y * 1.15); // very slightly squashed, sitting bead
                        float dist = length(dn);
                        if (dist < r) {
                            float core = 1.0 - dist / r;
                            result.xy = -d * 0.5; // gentle magnifying-glass pull, not a strong warp
                            result.z = core;

                            vec2 hlOff = d - vec2(-r * 0.32, -r * 0.32);
                            float hl = 1.0 - clamp(length(hlOff) / (r * 0.32), 0.0, 1.0);
                            result.w = hl * hl;
                        }

                        if (h1 > 0.6) { // only the larger ~40% of drops trickle
                            float trailLen = r * (2.5 + h1 * 3.5);
                            vec2 belowD = sp - (center + vec2(0.0, r * 0.5));
                            if (belowD.y > 0.0 && belowD.y < trailLen) {
                                float taper = 1.0 - belowD.y / trailLen;
                                float trailW = r * 0.18 * taper;
                                float lateral = abs(belowD.x);
                                if (lateral < trailW) {
                                    float trailCore = (1.0 - lateral / trailW) * taper * 0.4;
                                    result.z = max(result.z, trailCore);
                                    result.xy += vec2(-belowD.x * 0.3, 0.0);
                                }
                            }
                        }

                        if (result.z > bestResult.z || result.w > bestResult.w) {
                            // Fade out as it slides down so it mimics a drop appearing, sitting, and evaporating/vanishing
                            float lifeAlpha = smoothstep(1.0, 0.7, yFrac);
                            bestResult = result * lifeAlpha;
                        }
                    }
                }
                return bestResult;
            }

            void main() {
                // screenPos is CSS-pixel space, origin top-left, y-down — same
                // convention the gravity well shader above uses, and the same
                // space renderPostFX() computes world->screen positions in.
                vec2 screenPos = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
                vec2 offset = vec2(0.0);
                bool touched = false;
                float dropletGlow = 0.0;

                if (u_heatHazeEnabled > 0.5) {
                    // Kept subtle — real mirage haze is a gentle shimmer, not a
                    // warp, and world-space text labels ("PICK UP" etc.) get
                    // swept up in this same distortion pass along with the
                    // terrain, so a strong wobble hurts their legibility.
                    float wobbleX = sin(screenPos.y * 0.02 + u_time * 1.5) * 1.2;
                    float wobbleY = sin(screenPos.x * 0.015 + u_time * 1.2) * 0.6;
                    offset += vec2(wobbleX, wobbleY);
                    touched = true;
                }

                if (u_rainAmount > 0.05) {
                    vec4 d1 = droplet(screenPos, 130.0, 8.0, 0.0);
                    vec4 d2 = droplet(screenPos, 75.0, 4.5, 100.0);
                    float bodyHit = max(d1.z, d2.z);
                    float glintHit = max(d1.w, d2.w);
                    if (bodyHit > 0.0 || glintHit > 0.0) {
                        offset += d1.xy + d2.xy;
                        // Body refraction is nearly invisible on its own (the
                        // point is the subtle bend, not a visible shape) — the
                        // glint is what actually reads as "wet glass", kept
                        // small and faint rather than a bright blown highlight.
                        dropletGlow = (bodyHit * 0.02 + glintHit * 0.22) * u_rainAmount;
                        touched = true;
                    }
                }

                for (int i = 0; i < 4; i++) {
                    if (i >= u_waterCount) break;
                    vec2 mn = u_waterMin[i];
                    vec2 mx = u_waterMax[i];
                    if (screenPos.x >= mn.x && screenPos.x <= mx.x && screenPos.y >= mn.y && screenPos.y <= mx.y) {
                        float wave = sin(screenPos.x * 0.05 + u_time * 2.0) * 2.5
                                   + sin(screenPos.y * 0.08 - u_time * 1.3) * 1.5;
                        offset += vec2(wave * 0.6, wave * 0.3);
                        touched = true;
                    }
                }

                if (u_blackholeEnabled > 0.5) {
                    vec2 diff = screenPos - u_blackholePos;
                    float dist = length(diff);
                    if (dist < u_blackholeRadius && dist > 1.0) {
                        // Pull sampled pixels toward the well center — a cheap
                        // stand-in for gravitational lensing. Kept gentle (this
                        // project has a stated preference for a subtle well —
                        // see the README's "toned down twice" note) so it reads
                        // as a bend in the background, not a warp-y distraction.
                        float pull = 1.0 - dist / u_blackholeRadius;
                        pull = pull * pull;
                        offset -= diff * pull * 0.35;
                        touched = true;
                    }
                }

                if (!touched) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // No Y-flip here: texImage2D uploads the canvas with its top row
                // at v=0 (UNPACK_FLIP_Y_WEBGL is off), which matches screenPos's
                // top-left origin directly. An earlier version flipped v here,
                // which made every effect region render a vertically mirrored
                // copy of the scene — water bounding boxes filled with upside-
                // down sky (reported as a "flat blue rectangle" over the L1
                // lake) and mirrored text labels on heat-haze levels.
                vec2 distortedScreenPos = screenPos + offset;
                vec2 srcUV = distortedScreenPos / u_resolution;
                srcUV = clamp(srcUV, vec2(0.001), vec2(0.999));

                gl_FragColor = texture2D(u_sceneTex, srcUV);
                gl_FragColor.rgb += dropletGlow;
            }
        `;

        this.postFXProgram = this.createProgram(vsPostFXSource, fsPostFXSource);

        this.sceneTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    initBuffers() {
        if (!this.gl) return;
        const gl = this.gl;

        // Quad buffer for monster
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const quadVertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        
        // Particle buffers (dynamic)
        this.particlePosBuffer = gl.createBuffer();
        this.particleColorBuffer = gl.createBuffer();
        this.particleSizeBuffer = gl.createBuffer();
    }

    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        return program;
    }

    hexToRgb(hex) {
        // Simple hsla to rgba fallback if needed, but we'll try to handle colors mostly in JS.
        // Actually, the particles are using 'hsla(...)' in the game engine. We need to parse it.
        // For simplicity, we can do a crude parse or just pass pre-calculated rgb values.
    }

    parseHsla(str) {
        const match = str.match(/hsla?\((\d+\.?\d*),\s*(\d+\.?\d*)%?,\s*(\d+\.?\d*)%?(?:,\s*(\d+\.?\d*))?\)/);
        if (!match) return [1, 1, 1, 1];
        
        let h = parseFloat(match[1]) / 360;
        let s = parseFloat(match[2]) / 100;
        let l = parseFloat(match[3]) / 100;
        let a = match[4] !== undefined ? parseFloat(match[4]) : 1.0;

        let r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g, b, a];
    }

    // Post-processing pass: uploads the already-drawn Canvas2D scene as a texture,
    // then re-draws a warped version of it wherever an effect region is active
    // (heat haze, water shimmer, gravity lensing, and rain droplets on the
    // "camera lens" for levels with weather: 'rain').
    // `waterRects` is an array of up to 4 {minX,minY,maxX,maxY} screen-space
    // rects (see render.js's draw() for how they're computed from camera +
    // physics.waterBodies). Skips the texture upload entirely (the expensive
    // part) when nothing in the current level actually needs distorting.
    renderPostFX(physics, camera, sourceCanvas, levelConfig, waterRects, activeWeather) {
        if (!this.gl || !this.postFXProgram) return;
        const gl = this.gl;

        const heatHaze = !!(levelConfig && levelConfig.heatHaze);
        const hasBlackhole = !!physics.gravityWellPos;
        const hasWater = waterRects && waterRects.length > 0;
        const rain = (activeWeather === 'rain' || (levelConfig && levelConfig.weather === 'rain')) ? 1.0 : 0.0;
        if (!heatHaze && !hasBlackhole && !hasWater && !rain) return;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.postFXProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
        gl.uniform1i(gl.getUniformLocation(this.postFXProgram, "u_sceneTex"), 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const aPos = gl.getAttribLocation(this.postFXProgram, "a_position");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(gl.getUniformLocation(this.postFXProgram, "u_resolution"), this.canvas.width, this.canvas.height);
        gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_time"), Date.now() / 1000.0);
        gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_heatHazeEnabled"), heatHaze ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_rainAmount"), rain);

        const count = Math.min(4, waterRects ? waterRects.length : 0);
        const minArr = new Float32Array(8), maxArr = new Float32Array(8);
        for (let i = 0; i < count; i++) {
            minArr[i * 2] = waterRects[i].minX; minArr[i * 2 + 1] = waterRects[i].minY;
            maxArr[i * 2] = waterRects[i].maxX; maxArr[i * 2 + 1] = waterRects[i].maxY;
        }
        gl.uniform1i(gl.getUniformLocation(this.postFXProgram, "u_waterCount"), count);
        gl.uniform2fv(gl.getUniformLocation(this.postFXProgram, "u_waterMin"), minArr);
        gl.uniform2fv(gl.getUniformLocation(this.postFXProgram, "u_waterMax"), maxArr);

        if (hasBlackhole) {
            const gw = physics.gravityWellPos;
            const screenX = (gw.x - camera.x) * camera.zoom + this.canvas.width / 2;
            const screenY = (gw.y - camera.y) * camera.zoom + this.canvas.height / 2;
            gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_blackholeEnabled"), 1.0);
            gl.uniform2f(gl.getUniformLocation(this.postFXProgram, "u_blackholePos"), screenX, screenY);
            gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_blackholeRadius"), gw.radius * camera.zoom);
        } else {
            gl.uniform1f(gl.getUniformLocation(this.postFXProgram, "u_blackholeEnabled"), 0.0);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    render(physics, camera) {
        if (!this.gl) return;
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // --- Render Monster ---
        // Disabled: the detailed monster is now drawn in Canvas2D (game.js drawMonster).
        // The WebGL blob shader is kept for reference but no longer rendered.
        if (false && physics.monster) {
            gl.useProgram(this.monsterProgram);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
            const aPos = gl.getAttribLocation(this.monsterProgram, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            
            gl.uniform2f(gl.getUniformLocation(this.monsterProgram, "u_resolution"), this.canvas.width, this.canvas.height);
            gl.uniform2f(gl.getUniformLocation(this.monsterProgram, "u_monsterPos"), physics.monster.x, physics.monster.y);
            gl.uniform1f(gl.getUniformLocation(this.monsterProgram, "u_monsterSize"), physics.monster.size);
            gl.uniform2f(gl.getUniformLocation(this.monsterProgram, "u_cameraPos"), camera.x, camera.y);
            gl.uniform1f(gl.getUniformLocation(this.monsterProgram, "u_zoom"), camera.zoom);
            gl.uniform1f(gl.getUniformLocation(this.monsterProgram, "u_time"), Date.now() / 1000.0);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // --- Render Gravity Well ---
        if (physics.gravityWellPos) {
            const gw = physics.gravityWellPos;
            gl.useProgram(this.gravityWellProgram);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
            const aPos = gl.getAttribLocation(this.gravityWellProgram, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            
            gl.uniform2f(gl.getUniformLocation(this.gravityWellProgram, "u_resolution"), this.canvas.width, this.canvas.height);
            gl.uniform2f(gl.getUniformLocation(this.gravityWellProgram, "u_wellPos"), gw.x, gw.y);
            gl.uniform1f(gl.getUniformLocation(this.gravityWellProgram, "u_wellRadius"), gw.radius);
            gl.uniform1f(gl.getUniformLocation(this.gravityWellProgram, "u_wellPulse"), gw.pulse || 1.0);
            gl.uniform2f(gl.getUniformLocation(this.gravityWellProgram, "u_cameraPos"), camera.x, camera.y);
            gl.uniform1f(gl.getUniformLocation(this.gravityWellProgram, "u_zoom"), camera.zoom);
            gl.uniform1f(gl.getUniformLocation(this.gravityWellProgram, "u_time"), Date.now() / 1000.0);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // --- Render Particles ---
        if (physics.particles && physics.particles.length > 0) {
            const count = physics.particles.length;
            const positions = new Float32Array(count * 2);
            const colors = new Float32Array(count * 4);
            const sizes = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                const p = physics.particles[i];
                positions[i * 2] = p.x;
                positions[i * 2 + 1] = p.y;
                
                // Color parsing
                let rgba = [1,1,1,1];
                if (p.color.startsWith('hsl')) {
                    rgba = this.parseHsla(p.color);
                } else if (p.color === '#e2e8f0') {
                    rgba = [226/255, 232/255, 240/255, 1];
                } else if (p.color === '#475569') {
                    rgba = [71/255, 85/255, 105/255, 1];
                }
                // apply alpha/life
                rgba[3] = p.life;
                
                colors[i * 4] = rgba[0];
                colors[i * 4 + 1] = rgba[1];
                colors[i * 4 + 2] = rgba[2];
                colors[i * 4 + 3] = rgba[3];
                
                sizes[i] = p.size * 2.5; // Slightly larger for soft WebGL dots
            }

            gl.useProgram(this.particleProgram);

            // Positions
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
            const aPos = gl.getAttribLocation(this.particleProgram, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            // Colors
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
            const aCol = gl.getAttribLocation(this.particleProgram, "a_color");
            gl.enableVertexAttribArray(aCol);
            gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 0, 0);

            // Sizes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleSizeBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
            const aSize = gl.getAttribLocation(this.particleProgram, "a_size");
            gl.enableVertexAttribArray(aSize);
            gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

            // Uniforms
            gl.uniform2f(gl.getUniformLocation(this.particleProgram, "u_resolution"), this.canvas.width, this.canvas.height);
            gl.uniform2f(gl.getUniformLocation(this.particleProgram, "u_cameraPos"), camera.x, camera.y);
            gl.uniform1f(gl.getUniformLocation(this.particleProgram, "u_zoom"), camera.zoom);

            gl.drawArrays(gl.POINTS, 0, count);
        }
    }
}
