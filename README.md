# Teapot WebGL Viewer

Este projeto exibe o modelo 3D do Teapot usando WebGL puro, permitindo visualizar o interior, alternar entre faces externas/internas, rotacionar com o mouse e visualizar as arestas (wireframe).

## Estrutura do Projeto

```
├── index.html           # Página principal com shaders e canvas
├── main.js              # Código JavaScript principal (renderização, interação, etc)
├── src/
│   └── teapot.obj       # Modelo do teapot em formato OBJ
│   └── teapot_bezier0.tris (opcional)
└── ...
```

## Como rodar

1. Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge).
2. O modelo será carregado automaticamente e exibido no canvas.
3. Use o mouse para rotacionar o teapot.
4. Clique no botão "Mostrar só interior" para visualizar apenas o interior do objeto (culling de faces frontais).
5. As arestas do modelo são desenhadas em preto (wireframe).

## Funcionalidades

- **Renderização 3D do Teapot** usando WebGL puro.
- **Wireframe:** as arestas das faces são desenhadas em preto sobre o modelo.
- **Cor única:** o teapot é exibido com cor sólida laranja.
- **Visualização do interior:** botão para alternar entre mostrar tudo e mostrar só o interior (culling de faces frontais).
- **Rotação com mouse:** clique e arraste para rotacionar o modelo em X e Y.
- **Fundo claro:** facilita a visualização do modelo e das arestas.

## Dependências

- [gl-matrix](https://glmatrix.net/) (importado via CDN no HTML)
- Navegador com suporte a WebGL

## Observações

- O modelo usado é o `teapot.obj` (formato Wavefront OBJ) localizado na pasta `src/`.
- O arquivo `main.js` contém toda a lógica de renderização, interação e carregamento do modelo.
- Os shaders (vertex, fragment, wireframe) estão definidos no próprio `index.html`.
- O botão de alternância de interior/exterior está fixo no canto superior esquerdo.

## Como adaptar para outros modelos

- Basta substituir o arquivo OBJ em `src/teapot.obj` por outro modelo compatível.
- Certifique-se de que o modelo está corretamente formatado e referenciado no código.

---

Projeto desenvolvido para a disciplina de Computação Gráfica.