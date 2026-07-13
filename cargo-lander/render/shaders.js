class ShaderOverlay {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl', { alpha: true });
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
            uniform vec2 u_cameraPos;
            uniform float u_zoom;
            uniform float u_time;
            
            uniform int u_numWells;
            uniform vec2 u_wellPos[4];
            uniform float u_wellRadius[4];
            uniform float u_wellPulse[4];
            
            void main() {
                vec2 screenPos = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
                vec2 worldPos = (screenPos - (u_resolution / 2.0)) / u_zoom + u_cameraPos;
                
                vec3 finalColor = vec3(0.0);
                float finalAlpha = 0.0;
                
                for (int i = 0; i < 4; i++) {
                    if (i >= u_numWells) break;
                    
                    vec2 diff = worldPos - u_wellPos[i];
                    float dist = length(diff);
                    
                    if (dist <= u_wellRadius[i]) {
                        float normDist = dist / u_wellRadius[i];
                        float eventHorizon = 20.0;
                        
                        float angle = atan(diff.y, diff.x);
                        float swirl = sin(angle * 3.0 + u_time * 2.0 - normDist * 10.0);
                        float pulse = u_wellPulse[i];
                        float intensity = (1.0 - normDist) * (0.32 + 0.28 * swirl) * pulse * 0.7;
                        
                        // Shrinking circles feeding into the black hole
                        float circleDist = normDist * 8.0 + u_time * 3.0;
                        float circle = fract(circleDist);
                        float circlePulse = smoothstep(0.6, 0.8, circle) * (1.0 - smoothstep(0.8, 1.0, circle));
                        // The closer to the center (normDist near 0), the more opaque. 
                        // The further out (normDist near 1), the more transparent.
                        float circleFade = pow(1.0 - normDist, 2.5); // Steep exponential curve
                        intensity += circlePulse * 0.8 * circleFade;
                        
                        vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(0.6, 0.2, 0.9), intensity);
                        
                        // Soft fade for the event horizon
                        float ehFade = smoothstep(eventHorizon * 0.6, eventHorizon + 2.0, dist);
                        
                        finalColor += mix(vec3(0.0), color, ehFade);
                        float alphaRaw = max(intensity * (1.0 - normDist), 1.0 - ehFade);
                        finalAlpha = max(finalAlpha, alphaRaw);
                    }
                }
                
                gl_FragColor = vec4(finalColor, min(1.0, finalAlpha));
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
#ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
#else
            precision mediump float;
#endif
            varying vec2 v_uv;

            uniform sampler2D u_sceneTex;
            uniform vec2 u_resolution;
            uniform float u_time;

            uniform vec2 u_cameraPos;
            uniform float u_zoom;

            uniform float u_heatHazeEnabled;

            uniform int u_waterCount;
            uniform vec2 u_waterMin[4];
            uniform vec2 u_waterMax[4];

            uniform int u_numBlackholes;
            uniform vec2 u_blackholePos[4];
            uniform float u_blackholeRadius[4];

            uniform int u_numHeatSources;
            uniform vec3 u_heatSources[8];

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
                        // Time progression for this cell (less variance in speed so they fall more uniformly)
                        float cellSpeedH = hash21(cell + seed);
                        float t = u_time * (0.1 + 0.15 * cellSpeedH) + hash21(cell + seed + 11.0) * 100.0;
                        float cycle = floor(t);
                        float yFrac = fract(t);
                        
                        // Per-cycle random properties to avoid static patterns
                        float h1 = hash21(cell + seed + cycle * 13.37);
                        float h2 = hash21(cell + seed + cycle * 42.11 + 31.7);
                        float h3 = hash21(cell + seed + cycle * 99.99 + 57.3);
                        float h4 = hash21(cell + seed + cycle * 18.42 + 99.1);
                        
                        if (h3 > 0.02) continue; // FAR sparser field per cycle to break grid feel

                        float fade = smoothstep(0.4 + 0.4 * h4, 0.9, yFrac);
                        
                        // Roughly half the drops just sit there and fade out without sliding
                        bool isStatic = h1 > 0.5;
                        float slide = isStatic ? 0.0 : fade;
                        
                        // Let them wander further from the cell center to hide the grid
                        vec2 center = cell * cellSize + vec2(-0.2 + 1.4 * h1, -0.2 + 1.4 * h2) * cellSize;
                        center.y += slide * cellSize * 0.45;
                        
                        // Splat animation when it first hits the window
                        float hitExpand = smoothstep(0.0, 0.03, yFrac);
                        float hitSettle = smoothstep(0.03, 0.1, yFrac);
                        float splat = hitExpand * 1.2 - hitSettle * 0.2; // Grows 0 -> 1.2, settles to 1.0
                        
                        // Much more extreme size variation, including the splat animation
                        float r = rad * (0.3 + 1.4 * h2) * splat;

                        vec4 result = vec4(0.0);

                        vec2 d = sp - center;
                        
                        // Stretch the droplet head vertically when it slides to create a motion-blurred streak
                        float stretch = 1.0 + slide * 3.5;
                        
                        // Widen slightly as it starts sliding, then narrow sharply as it fades out
                        float widthAnim = 1.0 + sin(slide * 3.1415) * 0.3 - slide * 0.8;
                        widthAnim = max(0.1, widthAnim);
                        
                        // Mild teardrop shape (slightly wider at bottom, clamped safely)
                        float teardrop = max(0.6, 1.0 - (d.y / r) * 0.15);
                        
                        vec2 dn = vec2(d.x / (widthAnim * teardrop), d.y * 1.15 / stretch);
                        float dist = length(dn);
                        
                        if (dist < r) {
                            // Fuzzy uneven alpha map for the core
                            float noise = fract(sin(dot(sp, vec2(12.9898, 78.233))) * 43758.5453);
                            float core = smoothstep(r, r * 0.6, dist) * (0.8 + 0.2 * noise); 
                            
                            result.xy = -d * 0.45; // much stronger magnifying-glass pull (more light bending)
                            result.z = core;

                            vec2 hlOff = d - vec2(-r * 0.32, -r * 0.32);
                            // Fixed max size for the glint (doesn't scale infinitely with drop size)
                            float glintSize = min(3.0, r * 0.7);
                            float hl = smoothstep(glintSize, 0.0, length(hlOff));
                            result.w = hl;
                        }

                        // As the drop slides, leave a streak connecting back to original position
                        if (slide > 0.01) {
                            float trailLen = slide * cellSize * 0.7;
                            vec2 trailD = sp - center; 
                            // trailD.y is negative if sp is ABOVE center
                            if (trailD.y < 0.0 && trailD.y > -trailLen) {
                                float taper = 1.0 - (abs(trailD.y) / trailLen);
                                float trailW = r * 0.3 * taper;
                                float lateral = abs(trailD.x);
                                if (lateral < trailW) {
                                    float trailCore = smoothstep(trailW, trailW * 0.4, lateral) * taper * 0.5;
                                    result.z = max(result.z, trailCore);
                                    // Bend light vertically along the streak too
                                    result.xy += vec2(-trailD.x * 0.4, -trailD.y * 0.3) * taper;
                                }
                            }
                        }
                        
                        // Fade in quickly when hitting, and fade out over the end of the cycle
                        result *= hitExpand * (1.0 - fade);

                        if (result.z > bestResult.z || result.w > bestResult.w) {
                            // Fade in at start, sit, streak, then fade out
                            float lifeAlpha = smoothstep(0.0, 0.1, yFrac) * (1.0 - smoothstep(0.9, 1.0, yFrac));
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
                float waterBlend = 0.0;
                vec2 reflectOffset = vec2(0.0);

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

                for (int i = 0; i < 8; i++) {
                    if (i >= u_numHeatSources) break;
                    vec2 diff = screenPos - u_heatSources[i].xy;
                    float dist = length(diff);
                    float rad = u_heatSources[i].z;
                    if (dist < rad && rad > 0.0) {
                        float falloff = pow(1.0 - (dist / rad), 1.5);
                        float wobbleX = sin(screenPos.y * 0.15 + u_time * 25.0) * 1.0 * falloff;
                        float wobbleY = sin(screenPos.x * 0.15 + u_time * 20.0) * 1.0 * falloff;
                        offset += vec2(wobbleX, wobbleY);
                        touched = true;
                    }
                }

                float blackholeFade = 1.0;
                for (int i = 0; i < 4; i++) {
                    if (i >= u_numBlackholes) break;
                    vec2 diff = screenPos - u_blackholePos[i];
                    float dist = length(diff);
                    if (dist < u_blackholeRadius[i] && dist > 1.0) {
                        float pull = 1.0 - dist / u_blackholeRadius[i];
                        pull = pull * pull;
                        offset -= diff * pull * 0.35;
                        touched = true;
                    }
                    if (dist < u_blackholeRadius[i] * 0.8) {
                        blackholeFade = min(blackholeFade, smoothstep(0.0, u_blackholeRadius[i] * 0.8, dist));
                    }
                }

                if (u_rainAmount > 0.05 && blackholeFade > 0.01) {
                    vec4 d1 = droplet(screenPos, 120.0, 14.0, 0.0);
                    vec4 d2 = droplet(screenPos, 70.0, 7.0, 100.0);
                    float bodyHit = max(d1.z, d2.z);
                    float glintHit = max(d1.w, d2.w);
                    if (bodyHit > 0.0 || glintHit > 0.0) {
                        offset += (d1.xy + d2.xy) * u_rainAmount * blackholeFade;
                        // Focus on the physical light bending (refraction) rather than drawn color
                        dropletGlow = (bodyHit * 0.02 + glintHit * 0.15) * u_rainAmount * blackholeFade;
                        touched = true;
                    }
                }

                // World pos for stable waves that don't slide when camera moves
                vec2 worldPos = (screenPos - (u_resolution / 2.0)) / u_zoom + u_cameraPos;

                for (int i = 0; i < 4; i++) {
                    if (i >= u_waterCount) break;
                    vec2 mn = u_waterMin[i];
                    vec2 mx = u_waterMax[i];
                    if (screenPos.x >= mn.x && screenPos.x <= mx.x && screenPos.y >= mn.y && screenPos.y <= mx.y) {
                        float wave = sin(worldPos.x * 0.05 + u_time * 2.0) * 2.5
                                   + sin(worldPos.y * 0.08 - u_time * 1.3) * 1.5;
                        
                        // Soften X edges to prevent hard clipping against rock walls and screen tearing
                        float fadeX = smoothstep(mn.x, mn.x + 15.0, screenPos.x) * smoothstep(mx.x, mx.x - 15.0, screenPos.x);
                        
                        // Base water distortion (the subtle wave for the water surface itself)
                        // Multiplying by fadeX ensures the distortion doesn't tear the background image at the bounding box edges
                        offset += vec2(wave * 0.6, wave * 0.3) * fadeX;
                        
                        // Mirror reflection: offset Y so that we sample above the water surface
                        float surfaceOffset = 15.0; // The visual depth of the water surface band
                        float mirrorY = mn.y + surfaceOffset;
                        float reflectY = 2.0 * (mirrorY - screenPos.y);
                        reflectOffset = vec2(wave * 0.6, reflectY + wave * 0.3);
                        
                        // Fade reflection based on depth (height) so it's only visible near the surface
                        float depth = screenPos.y - mn.y;
                        float depthFade = smoothstep(70.0, 0.0, depth);
                        float startFade = smoothstep(surfaceOffset - 2.0, surfaceOffset + 2.0, depth);
                        
                        waterBlend = max(waterBlend, 0.45 * fadeX * depthFade * startFade); // Partly transparent, top only
                        
                        touched = true;
                    }
                }

                for (int i = 0; i < 4; i++) {
                    if (i >= u_numBlackholes) break;
                    vec2 diff = screenPos - u_blackholePos[i];
                    float dist = length(diff);
                    if (dist < u_blackholeRadius[i] && dist > 1.0) {
                        float coreRadius = 20.0 * u_zoom;
                        // Avoid singularity exactly at the center, but get very strong near the core
                        float safeDist = max(dist, coreRadius * 0.9);
                        // Exponential falloff based on distance from the core
                        float ratio = coreRadius / safeDist; 
                        // Power curve gives the "exponential" spike near the edge
                        float pull = pow(ratio, 3.0); 
                        // Scale the pull so it's not overpowering the whole screen, but intense near the core
                        offset += diff * pull * 0.6;
                        touched = true;
                    }
                    if (dist < u_blackholeRadius[i] * 0.8) {
                        blackholeFade = min(blackholeFade, smoothstep(0.0, u_blackholeRadius[i] * 0.8, dist));
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

                vec4 baseColor = texture2D(u_sceneTex, srcUV);
                
                if (waterBlend > 0.0) {
                    vec2 refUV = (screenPos + reflectOffset) / u_resolution;
                    refUV = clamp(refUV, vec2(0.001), vec2(0.999));
                    vec4 reflectColor = texture2D(u_sceneTex, refUV);
                    baseColor = mix(baseColor, reflectColor, waterBlend);
                }

                gl_FragColor = baseColor;
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
    // Uniform/attrib location lookup with per-program caching — getUniformLocation
    // is a driver round-trip; querying a dozen of them every frame showed up in
    // profiles. Locations are stable for a linked program, so cache forever.
    _loc(program, name) {
        let byProgram = this._locCache || (this._locCache = new Map());
        let locs = byProgram.get(program);
        if (!locs) { locs = new Map(); byProgram.set(program, locs); }
        let loc = locs.get(name);
        if (loc === undefined) {
            loc = name.charCodeAt(0) === 97 && name[1] === '_'  // 'a_' prefix
                ? this.gl.getAttribLocation(program, name)
                : this.gl.getUniformLocation(program, name);
            locs.set(name, loc);
        }
        return loc;
    }

    // Returns true if it actually drew anything — callers use this to skip the
    // full-screen Canvas2D drawImage() composite of this.canvas when the pass
    // was a no-op (no active effect regions in the level/viewport).
    renderPostFX(physics, camera, sourceCanvas, levelConfig, waterRects, activeWeather, heatSources) {
        if (!this.gl || !this.postFXProgram) return false;
        const gl = this.gl;

        const heatHaze = !!(levelConfig && levelConfig.heatHaze);
        const hasBlackhole = physics.gravityWells && physics.gravityWells.length > 0;
        const hasWater = waterRects && waterRects.length > 0;
        const rain = (activeWeather === 'rain' || (levelConfig && levelConfig.weather === 'rain')) ? 1.0 : 0.0;
        const hasLocalHeat = heatSources && heatSources.length > 0;
        if (!heatHaze && !hasBlackhole && !hasWater && !rain && !hasLocalHeat) return false;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.postFXProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
        gl.uniform1i(this._loc(this.postFXProgram, "u_sceneTex"), 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const aPos = this._loc(this.postFXProgram, "a_position");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this._loc(this.postFXProgram, "u_resolution"), this.canvas.width, this.canvas.height);
        gl.uniform1f(this._loc(this.postFXProgram, "u_time"), (Date.now() % 10000000) / 1000.0);
        gl.uniform2f(this._loc(this.postFXProgram, "u_cameraPos"), camera.x, camera.y);
        gl.uniform1f(this._loc(this.postFXProgram, "u_zoom"), camera.zoom);
        gl.uniform1f(this._loc(this.postFXProgram, "u_heatHazeEnabled"), heatHaze ? 1.0 : 0.0);
        gl.uniform1f(this._loc(this.postFXProgram, "u_rainAmount"), rain);

        const count = Math.min(4, waterRects ? waterRects.length : 0);
        // Reused scratch buffers — these were fresh Float32Array allocations per frame
        const minArr = this._waterMinArr || (this._waterMinArr = new Float32Array(8));
        const maxArr = this._waterMaxArr || (this._waterMaxArr = new Float32Array(8));
        for (let i = 0; i < count; i++) {
            minArr[i * 2] = waterRects[i].minX; minArr[i * 2 + 1] = waterRects[i].minY;
            maxArr[i * 2] = waterRects[i].maxX; maxArr[i * 2 + 1] = waterRects[i].maxY;
        }
        gl.uniform1i(this._loc(this.postFXProgram, "u_waterCount"), count);
        gl.uniform2fv(this._loc(this.postFXProgram, "u_waterMin"), minArr);
        gl.uniform2fv(this._loc(this.postFXProgram, "u_waterMax"), maxArr);

        if (physics.gravityWells && physics.gravityWells.length > 0) {
            const count = Math.min(4, physics.gravityWells.length);
            const posArr = this._bhPosArr || (this._bhPosArr = new Float32Array(8));
            const radArr = this._bhRadArr || (this._bhRadArr = new Float32Array(4));
            for (let i = 0; i < count; i++) {
                const gw = physics.gravityWells[i];
                const screenX = (gw.x - camera.x) * camera.zoom + this.canvas.width / 2;
                const screenY = (gw.y - camera.y) * camera.zoom + this.canvas.height / 2;
                posArr[i * 2] = screenX;
                posArr[i * 2 + 1] = screenY;
                radArr[i] = gw.radius * camera.zoom;
            }
            gl.uniform1i(this._loc(this.postFXProgram, "u_numBlackholes"), count);
            gl.uniform2fv(this._loc(this.postFXProgram, "u_blackholePos"), posArr);
            gl.uniform1fv(this._loc(this.postFXProgram, "u_blackholeRadius"), radArr);
        } else {
            gl.uniform1i(this._loc(this.postFXProgram, "u_numBlackholes"), 0);
        }

        if (hasLocalHeat) {
            const count = Math.min(8, heatSources.length);
            const heatArr = this._heatArr || (this._heatArr = new Float32Array(24));
            for (let i = 0; i < count; i++) {
                const hs = heatSources[i];
                const screenX = (hs.x - camera.x) * camera.zoom + this.canvas.width / 2;
                const screenY = (hs.y - camera.y) * camera.zoom + this.canvas.height / 2;
                heatArr[i * 3] = screenX;
                heatArr[i * 3 + 1] = screenY;
                heatArr[i * 3 + 2] = hs.radius * camera.zoom;
            }
            gl.uniform1i(this._loc(this.postFXProgram, "u_numHeatSources"), count);
            gl.uniform3fv(this._loc(this.postFXProgram, "u_heatSources"), heatArr);
        } else {
            gl.uniform1i(this._loc(this.postFXProgram, "u_numHeatSources"), 0);
        }

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        this._glCanvasDirty = true; // render() must clear before its own skip check
        return true;
    }

    // Returns true if anything was drawn (gravity wells or particles) so the
    // caller can skip the full-screen drawImage composite when idle.
    render(physics, camera) {
        if (!this.gl) return false;
        const gl = this.gl;
        const hasWells = physics.gravityWells && physics.gravityWells.length > 0;
        const hasParticles = physics.particles && physics.particles.length > 0;
        // Nothing to draw this frame. Only skip the clear if the canvas is
        // already blank — otherwise last frame's particles would linger.
        if (!hasWells && !hasParticles) {
            if (!this._glCanvasDirty) return false;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this._glCanvasDirty = false;
            return false;
        }
        this._glCanvasDirty = true;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
            gl.uniform1f(gl.getUniformLocation(this.monsterProgram, "u_time"), (Date.now() % 10000000) / 1000.0);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // --- Render Gravity Well ---
        if (physics.gravityWells && physics.gravityWells.length > 0) {
            gl.useProgram(this.gravityWellProgram);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
            const aPos = this._loc(this.gravityWellProgram, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            
            gl.uniform2f(this._loc(this.gravityWellProgram, "u_resolution"), this.canvas.width, this.canvas.height);
            gl.uniform2f(this._loc(this.gravityWellProgram, "u_cameraPos"), camera.x, camera.y);
            gl.uniform1f(this._loc(this.gravityWellProgram, "u_zoom"), camera.zoom);
            gl.uniform1f(this._loc(this.gravityWellProgram, "u_time"), (Date.now() % 10000000) / 1000.0);
            
            const count = Math.min(4, physics.gravityWells.length);
            const posArr = new Float32Array(8);
            const radArr = new Float32Array(4);
            const pulseArr = new Float32Array(4);
            
            for (let i = 0; i < count; i++) {
                const gw = physics.gravityWells[i];
                posArr[i * 2] = gw.x;
                posArr[i * 2 + 1] = gw.y;
                radArr[i] = gw.radius;
                pulseArr[i] = gw.pulse || 1.0;
            }
            
            gl.uniform1i(this._loc(this.gravityWellProgram, "u_numWells"), count);
            gl.uniform2fv(this._loc(this.gravityWellProgram, "u_wellPos"), posArr);
            gl.uniform1fv(this._loc(this.gravityWellProgram, "u_wellRadius"), radArr);
            gl.uniform1fv(this._loc(this.gravityWellProgram, "u_wellPulse"), pulseArr);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // --- Render Particles ---
        // Disabled: Particles are now drawn exclusively in Canvas2D to support
        // advanced vector shapes (sparks, smoke, rings) instead of soft dots.
        // if (physics.particles && physics.particles.length > 0) { ... }

        return true;
    }
}
