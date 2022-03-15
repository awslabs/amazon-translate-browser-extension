import { JSDOM } from 'jsdom';

const BASE_DOM_START = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>TEST DOM</title>
  </head>
  <body>
`;

const BASE_DOM_END = `
  </body>
  </html>
`;

export const DOM = (): JSDOM =>
  new JSDOM(`
${BASE_DOM_START}
  <div class="ancestor">
    <div class="parent1">
      <p class="child1">
        child 1 text node
      </p>
      <p class="child2">
        child 2 text node
      </p>
    </div>
    <div class="parent2">
      <div class="child">
        parent 2 child text node
        <p>
          parent 2 grandchild p tag
        </p>
      </div>
    </div>
  </div>
${BASE_DOM_END}
`);

export const DOM_WITH_EMPTY = (): JSDOM =>
  new JSDOM(`
    ${BASE_DOM_START}
      <p>I'm not empty</p>
      <p>       </p>
    ${BASE_DOM_END}
  `);

export const DOM_EL_POPULATED = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<p id="test">populated text</p>${BASE_DOM_END}`);

export const DOM_EL_EMPTY = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<p id="test">     </p>${BASE_DOM_END}`);

export const DOM_EL_SCRIPT = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<script>console.log('hello world!');</script>${BASE_DOM_END}`);

export const DOM_EL_STYLE = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<style>.error { color: red; }</style>${BASE_DOM_END}`);

export const DOM_EL_PRE = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<pre>console.log('hello world!');</pre>${BASE_DOM_END}`);

export const DOM_EL_COMMENT = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<!-- This is a comment. -->${BASE_DOM_END}`);

export const DOM_EL_NOSCRIPT = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<noscript>JavaScript is disabled.</noscript>${BASE_DOM_END}`);

export const DOM_EL_CODE = (): JSDOM =>
  new JSDOM(`${BASE_DOM_START}<code>$: npm run test</code>${BASE_DOM_END}`);
