# Easy js

A simple framework created to minimize the need for writing long lines of javascript

## Utilities

- CreateElement

```javascript
const el = CreateElement("button", {
  class: "btn test",
  text: "hi there",
  // Add event listeners
  onClick: () => {
    el.removeProps({
      class: "test",
    });
  },
});
```

#

- QuerySelector

```javascript
const button = QuerySelector(
  ".btn",
  {
    class: "found-btn",
    onClick: () => console.log("You found me :-)"),
  },
  parentNodeToSearchInside // (Optional)
);
```

#

- CreateTemplate

```javascript
// Experimental
const template = CreateTemplate(body, {
  span: {
    text: "hi im span",
  },
  div: {
    class: "test 2",
    text: "Iam here",
  },
  fragment: [
    test,
    {
      h2: {
        onclick: () => console.log("we are good"),
        text: "hi im h2",
      },
    },
  ],
});
```

#

- CreateForm

```javascript
const form = CreateForm({
  username: {
    element: "input",
    class: "im working",
    name: "username",
    id: "123",
    label: { text: "username", for: "123" },
    placeholder: "type...",
  },
  number: {
    label: { text: "12" },
    name: "number",
    element: "input",
    type: "checkbox",
    value: "12",
  },
  myGroup: {
    element: "checkboxGroup",
    labels: [],
    props: {},
  },
  Nnumber: {
    name: "number",
    element: "input",
    type: "checkbox",
    value: "1122",
  },
  submit: {
    element: "input",
    type: "submit",
    class: "btn",
    value: "123",
  },
  formProps: {
    class: "formee",
    onSubmit: (e) => {
      e.preventDefault();

      console.log("everything is fine");
      console.log(
        // set any value in form
        form.set({
          username: "hi there",
          number: ["12", "1122"],
        }),
        // Get all values from form elements
        form.getAll()
      );
    },
  },
});
```

### More utils

- CopyToClipboard
- CutToClipboard
- FormatDate
- Ajax
