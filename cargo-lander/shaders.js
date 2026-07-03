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
                
                // Pulsing glow
                float pulse = u_wellPulse;
                
                float intensity = (1.0 - normDist) * (0.5 + 0.5 * swirl) * pulse;
                
                // Purple/black lensing effect
                vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(0.6, 0.2, 0.9), intensity);
                
                gl_FragColor = vec4(color, intensity * (1.0 - normDist));
            }
        `;

        this.gravityWellProgram = this.createProgram(vsGravityWellSource, fsGravityWellSource);
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
