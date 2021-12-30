import { JSDOM } from 'jsdom';

export const DOM = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>TEST DOM</title>
</head>
<body>
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
</body>
</html>
`);

export const DOM_WITH_EMPTY = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>TEST DOM</title>
</head>
<body>
  <p>I'm not empty</p>
  <p>       </p>
</body>
</html>
`);

export const DOM_EL_POPULATED = new JSDOM(`<!DOCTYPE html><p id="test">populated text</p>`);
export const DOM_EL_EMPTY = new JSDOM(`<!DOCTYPE html><p id="test">     </p>`);
