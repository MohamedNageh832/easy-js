const CreateElement = (element, props) => {
  if (isValidHtmlTag(element)) {
    const el = document.createElement(element);
    props && attachProps(el, props);
    attachMethods(el);

    return el;
  }
};

const QuerySelector = (selector, props, node) => {
  const el = node
    ? node.querySelector(selector)
    : document.querySelector(selector);

  if (el.nodeType === Node.ELEMENT_NODE) {
    props && attachProps(el, props);

    attachMethods(el);
    return el;
  } else {
    throw Error(`can't find an element with the selector "${selector}"`);
  }
};

const QuerySelectorAll = (selector, props, node) => {
  const elements = node
    ? node.querySelectorAll(selector)
    : document.querySelectorAll(selector);

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    if (el.nodeType === Node.ELEMENT_NODE) {
      props && attachProps(el, props);

      attachProperties(el);
      attachMethods(el);
    } else {
      throw Error(`can't find elements with the selector "${selector}"`);
    }
  }

  return elements;
};

const CreateTemplate = (parent, children) => {
  const template = handleChildren(parent, children);

  return template;
};

function handleChildren(parent, children) {
  const childrenKeys = Object.keys(children);

  for (let i = 0; i < childrenKeys.length; i++) {
    const child = childrenKeys[i];
    const element = children[child]["element"];

    if (child === "fragment") {
      const [nestedParent, nestedChildren] = children[child];
      const el = handleChildren(nestedParent, nestedChildren);

      parent.appendChild(el);
    } else if (isValidElement(children[child])) {
      // check this one
      parent.appendChild(children[child]);
    } else if (isValidHtmlTag(element)) {
      const el = CreateElement(element, children[child]);
      parent.appendChild(el);
    }
  }

  return parent;
}

const Ajax = () => {
  let abortCont;

  let error = null;
  let isPending = false;

  const abort = () => {
    if (abortCont) abortCont.abort();
    else console.error("no ongoing fetch requests");
  };

  const get = async (url) => {
    abortCont = new AbortController();
    isPending = true;

    try {
      const res = await fetch(url, { signal: abortCont.signal });
      if (!res.ok) throw Error("Failed to fetch");

      const data = isValidJson(res) ? await res.json() : res.text();

      return data;
    } catch (err) {
      error = err;
      console.log(err);
    } finally {
      abortCont = null;
    }
  };

  const post = async (url, requestBody) => {
    abortCont = new AbortController();
    isPending = true;

    try {
      const body =
        typeof requestBody !== "object"
          ? requestBody
          : JSON.stringify(requestBody);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        signal: abortCont.signal,
      });
      if (!res.ok) throw Error("Failed to fetch");

      const data = isValidJson(res) ? await res.json() : res.text();

      return data;
    } catch (err) {
      error = err;
      console.log(err);
    } finally {
      abortCont = null;
    }
  };

  return { isPending, error, abort, get, post };
};

const CopyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

const CutToClipboard = (element) => {
  if (isValidElement(element) && element.tagName === "INPUT") {
    CopyToClipboard(element.value);

    element.value = "";
  }
};

const FormatDate = (value) => {
  try {
    const date = new Date();
    const dd = date.getDate();
    const mm = date.getMonth();
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  } catch (err) {
    throw Error(`Error: "${value}" is invalid date`);
  }
};

// handle checkboxGroup in form
const CreateForm = (children) => {
  const childrenKeys = Object.keys(children);
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < childrenKeys.length; i++) {
    const child = childrenKeys[i];
    const childProps = children[child];
    const { label, element, ...props } = childProps;
    const elementHasLabel = label !== undefined;

    if (isValidFormElement(element)) {
      if (elementHasLabel) {
        const labelElement = CreateElement("label", childProps.label);
        const el = createFormElement(element, props);

        if (props.type === "checkbox" || props.type === "radio") {
          fragment.append(el, labelElement);
        } else {
          fragment.append(labelElement, el);
        }

        // fragment.appendChild(createFormGroup(child, childProps));
      } else {
        fragment.appendChild(createFormElement(element, props));
      }

      if (element === "checkboxGroup") {
        // elementProps, labelProps
        const { labels, elementsCount, ...otherProps } = props;
        const elementType = element.substring(
          element.length - 5,
          element.length
        );

        for (let i = 0; i < labels.length; i++) {
          fragment.appendChild(CreateElement(elementType, otherProps));
        }
      }
    } else if (child !== "formProps") {
      console.error(
        `Error: "${element}" is not a valid form element, use camalCase for form groups`
      );
    }
  }

  const formProps = children["formProps"];
  const form = CreateElement("form", formProps);
  form.appendChild(fragment);

  attachProperties(form);
  attachMethods(form);
  handleFormMethods(form);

  return form;
};

// handle select and other elements

function createFormElement(element, elementProps) {
  if (isValidInputType(element)) {
    const props = { type: element, ...elementProps };

    return CreateElement("input", props);
  } else {
    const props = elementProps;

    return CreateElement(element, props);
  }
}

// TODO: handle separated groups
function createFormGroup(element, elementProps) {
  const formGroup = {
    label: {
      text: elementProps.name,
    },
    [element]:
      element === "input" ? elementProps : { ...elementProps, type: element },
  };
  return CreateTemplate("div", formGroup);
}

function handleFormMethods(form) {
  // check performance
  form.get = (name) => getFormValue(form, name);
  form.getAll = () => getAllFormValues(form);
  form.set = (object) => setFormValues(form, object);
}

function getFormValue(form, name) {
  const elements = Array.from(form.querySelectorAll(`*[name=${name}]`));

  if (elements.length > 1) {
    const targetedEl = elements.filter((el) => el.checked === true);

    if (targetedEl.length > 1) return targetedEl.map((el) => el.value);

    return targetedEl[0].value;
  }

  return elements[0].value;
}

function getAllFormValues(form) {
  const children = [...form.children].filter((el) => el.type !== "submit");

  const valuesObj = {};

  children.map((el) => {
    if (el.type === "radio") {
      if (valuesObj[el.name] === undefined || valuesObj[el.name] === "")
        Object.assign(valuesObj, { [el.name]: el.checked ? el.value : "" });
    } else if (el.type === "checkbox") {
      if (valuesObj[el.name] !== undefined && el.checked) {
        Object.assign(valuesObj, {
          [el.name]: [...valuesObj[el.name], el.value],
        });
      } else if (el.checked) {
        Object.assign(valuesObj, {
          [el.name]: [el.value],
        });
      }
    } else if (!isSkipableFormElement(el.nodeName.toLowerCase())) {
      Object.assign(valuesObj, { [el.name]: el.value });
    }
  });

  return valuesObj;
}

// handle function {big bugs}
function setFormValues(form, obj) {
  const formKeys = Object.keys(obj);
  const formChildren = [...form.children].filter(
    (el) =>
      !isSkipableFormElement(el.nodeName.toLowerCase()) && el.type !== "submit"
  );

  for (let i = 0; i < formChildren.length; i++) {
    const element = formChildren[i];
    const matchedKey = formKeys.indexOf(element.name);

    if (element.type === "checkbox" || element.type === "radio") {
      if (
        matchedKey !== -1 &&
        (obj[formKeys[matchedKey]] === element.value ||
          obj[formKeys[matchedKey]].includes(element.value))
      ) {
        element.checked = true;
      } else {
        element.checked = false;
      }
    } else {
      element.value = formKeys[matchedKey];
    }
  }
}

function attachProperties(el) {
  el.parent = el.parentElement;
  el.siblings = () => getSiblings(el);
}

function attachMethods(el) {
  el.attachProps = (props) => attachProps(el, props);
  el.removeProps = (props) => removeProps(el, props);
  el.insertAfter = (node, child) => insertAfter(el, node, child);
  el.getChild = (selector, props) => QuerySelector(selector, props, el);
  el.getChildren = (selector, props) => QuerySelectorAll(selector, props, el);
}

function insertAfter(parent, node, child) {
  parent.insertBefore(child, node);
}

function getSiblings(el) {
  return (
    Array.from(el.parentElement.children).filter((ele) => el !== ele) || null
  );
}

function attachProps(element, props) {
  const propsKeys = Object.keys(props);

  for (let i = 0; i < propsKeys.length; i++) {
    const prop = propsKeys[i];

    if (prop.startsWith("on")) {
      const event = prop.toLowerCase();

      if (isValidEvent(event)) {
        element.addEventListener(event.substring(2, event.length), props[prop]);
      } else {
        throw Error(`"${prop}" is not a valid event`);
      }
    } else if (prop === "text") {
      element.textContent = props[prop];
    } else {
      element.setAttribute(prop, props[prop]);
    }
  }
}

function removeProps(element, props) {
  const propsKeys = Object.keys(props);

  for (let i = 0; i < propsKeys.length; i++) {
    const prop = propsKeys[i];

    if (prop === "class") {
      element.classList.remove(props[prop]);
    } else if (prop.startsWith("on")) {
      const event = prop.toLowerCase();

      if (isValidEvent(event)) {
        element.remove(event.substring(2, event.length), props[prop]);
      } else {
        throw Error(`"${prop}" is not a valid event`);
      }
    } else {
      element.removeAttribute(prop);
    }
  }
}

function isSkipableFormElement(element) {
  return formSkipableElements.includes(element);
}

function isValidInputType(type) {
  return inputTypes.includes(type);
}

function isValidFormElement(element) {
  return formElements.includes(element);
}

function isValidJson(data) {
  try {
    JSON.parse(data);
  } catch (err) {
    return false;
  }

  return true;
}

function isValidElement(element) {
  return element.nodeType === Node.ELEMENT_NODE;
}

function isValidEvent(event) {
  return events.includes(event);
}

function isValidHtmlTag(el) {
  return htmlElements.includes(el);
}

// handle form elements like (select, datalist, ...)
// const form = [];

const inputTypes = ["checkbox", "radio", "file", "date", "dateTime", "submit"];

const formSkipableElements = [
  "label",
  "button",
  "submit",
  "fieldset",
  "legend",
  "datalist",
  "output",
  "option",
  "optgroup",
];

// TODO: copy all form elements
const formElements = ["input", "label", "select", "checkboxGroup"];

const htmlElements = [
  "a",
  "abbr",
  "acronym",
  "address",
  "applet",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "basefont",
  "bdi",
  "bdo",
  "bgsound",
  "big",
  "blink",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "content",
  "data",
  "datalist",
  "dd",
  "decorator",
  "del",
  "details",
  "dfn",
  "dir",
  "div",
  "dl",
  "dt",
  "element",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "font",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "isindex",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "listing",
  "main",
  "map",
  "mark",
  "marquee",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "nobr",
  "noframes",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "plaintext",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "shadow",
  "small",
  "source",
  "spacer",
  "span",
  "strike",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "tt",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "xmp",
];

const events = [
  "Offline",
  "Onabort",
  "onafterprint",
  "onbeforeonload",
  "onbeforeprint",
  "onblur",
  "oncanplay",
  "oncanplaythrough",
  "onchange",
  "onclick",
  "oncontextmenu",
  "ondblclick",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onfocus",
  "onformchange",
  "onforminput",
  "onhaschange",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onmessage",
  "onmousedown",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onmousewheel",
  "onoffline",
  "onoine",
  "ononline",
  "onpagehide",
  "onpageshow",
  "onpause",
  "onplay",
  "onplaying",
  "onpopstate",
  "onprogress",
  "onratechange",
  "onreadystatechange",
  "onredo",
  "onresize",
  "onscroll",
  "onseeked",
  "onseeking",
  "onselect",
  "onstalled",
  "onstorage",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "onundo",
  "onunload",
  "onvolumechange",
  "onwaiting",
];

export {
  CreateElement,
  QuerySelector,
  CreateTemplate,
  CreateForm,
  CopyToClipboard,
  CutToClipboard,
  FormatDate,
  Ajax,
};
