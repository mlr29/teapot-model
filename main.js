const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl", { antialias: true });

if (!gl) alert("WebGL não suportado.");

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

async function loadTeapotOBJ(url) {
    const text = await fetch(url).then((res) => res.text());
    const positions = [],
        normals = [],
        indices = [];
    const tempVertices = [],
        tempNormals = [];
    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith("v ")) {
            const [, x, y, z] = line.split(/\s+/).map(Number);
            tempVertices.push([x, y, z]);
        } else if (line.startsWith("vn ")) {
            const [, x, y, z] = line.split(/\s+/).map(Number);
            tempNormals.push([x, y, z]);
        } else if (line.startsWith("f ")) {
            const verts = line.slice(2).trim().split(" ");
            for (let i = 1; i < verts.length - 1; i++) {
                [0, i, i + 1].forEach((idx) => {
                    const parts = verts[idx].split("/");
                    const v = parseInt(parts[0], 10);
                    const n = parts.length > 2 ? parseInt(parts[2], 10) : null;
                    if (!isNaN(v) && v > 0 && tempVertices[v - 1]) {
                        positions.push(...tempVertices[v - 1]);
                    }
                    if (n !== null && !isNaN(n) && n > 0 && tempNormals[n - 1]) {
                        normals.push(...tempNormals[n - 1]);
                    } else {
                        // fallback: push                                     mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1, -6]);a default normal if missing
                        normals.push(0, 0, 1);
                    }
                    indices.push(indices.length);
                });
            }
        }
    }

    return { positions, normals, indices };
}

// Função para carregar modelo customizado .norm (ponto, normal, ponto, normal...)
async function loadTeapotNormFormat(url) {
    const text = await fetch(url).then(res => res.text());
    const lines = text.trim().split('\n');
    const nFaces = parseInt(lines[0]);
    const vertices = [];
    const normals = [];
    let i = 1;
    for (let f = 0; f < nFaces; f++) {
        for (let v = 0; v < 3; v++) {
            // Ponto
            const point = lines[i++].trim().split(/\s+/).map(Number);
            vertices.push(...point);
            // Normal correspondente
            const normal = lines[i++].trim().split(/\s+/).map(Number);
            normals.push(...normal);
        }
    }
    // Cada face é um triângulo, então os índices são [0,1,2, 3,4,5, ...]
    const indices = [];
    for (let f = 0; f < nFaces; f++) {
        indices.push(f * 3, f * 3 + 1, f * 3 + 2);
    }
    return { positions: vertices, normals, indices };
}

// Função para carregar modelo customizado .norm/.tris
async function loadTeapotTrisAndNorms(url) {
    const text = await fetch(url).then(res => res.text());
    const lines = text.trim().split('\n');
    const nFaces = parseInt(lines[0]);
    const vertices = [];
    const normals = [];
    let i = 1;
    for (let f = 0; f < nFaces; f++) {
        // 3 pontos
        for (let v = 0; v < 3; v++, i++) {
            const parts = lines[i].trim().split(/\s+/).map(Number);
            vertices.push(...parts);
        }
        // 3 normais
        for (let v = 0; v < 3; v++, i++) {
            const parts = lines[i].trim().split(/\s+/).map(Number);
            normals.push(...parts);
        }
    }
    const indices = Array.from({ length: vertices.length / 3 }, (_, k) => k);
    return { positions: vertices, normals, indices };
}

function setBuffer(gl, data, type, usage, attribLoc, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new Float32Array(data), usage);
    if (attribLoc !== undefined) {
        gl.enableVertexAttribArray(attribLoc);
        gl.vertexAttribPointer(attribLoc, size, gl.FLOAT, false, 0, 0);
    }
    return buffer;
}

function normalizeMatrix(mvMatrix) {
    const normalMatrix = mat3.create();
    mat3.normalFromMat4(normalMatrix, mvMatrix);
    return normalMatrix;
}

async function main() {
    // await compareModels('./src/teapot.obj', './src/teapot_surface0.norm');


    const vsSource = document.getElementById("vs").textContent;
    const fsSource = document.getElementById("fs").textContent;
    const program = createProgram(gl, vsSource, fsSource);
    gl.useProgram(program);

    // Escolha o modelo a ser carregado
    // Para OBJ: './src/teapot.obj'
    // Para formato customizado: './src/teapot_surface0.norm'
    const modelPath = './src/teapot.obj'; // Altere para .obj se quiser testar o outro formato
    let modelData;
    if (modelPath.endsWith('.obj')) {
        modelData = await loadTeapotOBJ(modelPath);
    } else if (modelPath.endsWith('.norm')) {
        modelData = await loadTeapotNormFormat(modelPath);
    } else if (modelPath.endsWith('.tris')) {
        modelData = await loadTeapotTrisAndNorms(modelPath);
    } else {
        throw new Error('Formato de modelo não suportado');
    }
    const { positions, normals, indices } = modelData;

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aNormal = gl.getAttribLocation(program, "aNormal");
    setBuffer(gl, positions, gl.ARRAY_BUFFER, gl.STATIC_DRAW, aPosition, 3);
    setBuffer(gl, normals, gl.ARRAY_BUFFER, gl.STATIC_DRAW, aNormal, 3);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    const uModelViewMatrix = gl.getUniformLocation(
        program,
        "uModelViewMatrix"
    );
    const uProjectionMatrix = gl.getUniformLocation(
        program,
        "uProjectionMatrix"
    );
    const uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
    const uLightDirection = gl.getUniformLocation(
        program,
        "uLightDirection"
    );

    const projMatrix = mat4.create();
    const modelViewMatrix = mat4.create();

    mat4.perspective(
        projMatrix,
        Math.PI / 2 ,
        canvas.width / canvas.height,
        0.1,
        500
    );
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1, -200]);
    mat4.rotateY(
        modelViewMatrix,
        modelViewMatrix,
        performance.now() * 0.001
    );

    gl.uniformMatrix4fv(uProjectionMatrix, false, projMatrix);
    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix3fv(
        uNormalMatrix,
        false,
        normalizeMatrix(modelViewMatrix)
    );
    gl.uniform3fv(uLightDirection, [1.0, 1.0, 1.0]);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    let lastX = 0;
    let dragging = false;
    let rotationY = 0;
    let rotationX = 0;

    // Eventos de mouse
    canvas.addEventListener("mousedown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    canvas.addEventListener("mouseup", () => {
        dragging = false;
    });
    canvas.addEventListener("mouseleave", () => {
        dragging = false;
    });
    canvas.addEventListener("mousemove", (e) => {
        if (dragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            rotationY += dx * 0.01;
            rotationX += dy * 0.01;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });
    
    // Eventos de toque (touch) para dispositivos móveis
    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            dragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    });
    canvas.addEventListener("touchend", () => {
        dragging = false;
    });
    canvas.addEventListener("touchcancel", () => {
        dragging = false;
    });
    canvas.addEventListener("touchmove", (e) => {
        if (dragging && e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastX;
            const dy = e.touches[0].clientY - lastY;
            rotationY += dx * 0.01;
            rotationX += dy * 0.01;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
            e.preventDefault();
        }
    }, { passive: false });

    const fsWireframeSource = document.getElementById("fs-wireframe").textContent;
    const programWireframe = createProgram(gl, vsSource, fsWireframeSource);

    let showOnlyInterior = false;
    document.getElementById("toggle-front").addEventListener("click", function () {
        showOnlyInterior = !showOnlyInterior;
        this.textContent = showOnlyInterior ? "Mostrar tudo" : "Mostrar só interior";
    });

    function getWireframeIndices(indices) {
        const lines = [];
        for (let i = 0; i < indices.length; i += 3) {
            lines.push(indices[i], indices[i + 1]);
            lines.push(indices[i + 1], indices[i + 2]);
            lines.push(indices[i + 2], indices[i]);
        }
        return lines;
    }

    const wireframeIndices = getWireframeIndices(indices);
    const wireframeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireframeBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(wireframeIndices),
        gl.STATIC_DRAW
    );

    function render() {
        // Reset modelViewMatrix
        mat4.identity(modelViewMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1, -100]);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, rotationY);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, rotationX);

        // --- Desenhar faces preenchidas ---
        gl.useProgram(program);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix3fv(uNormalMatrix, false, normalizeMatrix(modelViewMatrix));
        gl.uniformMatrix4fv(uProjectionMatrix, false, projMatrix);
        gl.clearColor(0.9, 0.9, 0.9, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        // --- Desenhar arestas (wireframe) ---
        gl.useProgram(programWireframe);
        const uModelViewMatrixWire = gl.getUniformLocation(programWireframe, "uModelViewMatrix");
        const uProjectionMatrixWire = gl.getUniformLocation(programWireframe, "uProjectionMatrix");
        gl.uniformMatrix4fv(uModelViewMatrixWire, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrixWire, false, projMatrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireframeBuffer);
        gl.lineWidth(1.5);
        gl.drawElements(gl.LINES, wireframeIndices.length, gl.UNSIGNED_SHORT, 0);

        // --- Controle de culling ---
        if (showOnlyInterior) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);
        } else {
            gl.disable(gl.CULL_FACE);
        }

        requestAnimationFrame(render);
    }
    render();
}

async function compareModels(objPath, normPath) {
    const objData = await loadTeapotOBJ(objPath);
    const normData = await loadTeapotNormFormat(normPath);
    console.log('--- COMPARAÇÃO OBJ x NORM ---');
    console.log('OBJ vertices:', objData.positions.length, objData.positions.slice(0, 12));
    console.log('NORM vertices:', normData.positions.length, normData.positions.slice(0, 12));
    console.log('OBJ normals:', objData.normals.length, objData.normals.slice(0, 12));
    console.log('NORM normals:', normData.normals.length, normData.normals.slice(0, 12));
    console.log('OBJ indices:', objData.indices.length, objData.indices.slice(0, 12));
    console.log('NORM indices:', normData.indices.length, normData.indices.slice(0, 12));
    // Se quiser comparar todos os valores, pode usar JSON.stringify ou um diff mais elaborado
}

// Chame compareModels no início do main() para testar:
// await compareModels('./src/teapot.obj', './src/teapot_surface0.norm');

main();
