NOTE: experimental

# jevkoml

Codename .jevkoml.

A [Jevko](https://jevko.org) format for markup that translates to HTML/XML.

Compared to HTML or XML, .jevkoml is delightful to write, edit, or generate -- by hand or otherwise.

.jevkoml can make authoring and maintaining HTML documents, XML configurations, SVG graphics, and countless other XML-based formats much more pleasant.

Gives you the full power of XML by supporting its data model and XML literals.

On top of that you get a much simpler and leaner syntax with:

* here documents (heredocs) -- like CDATA, but with user-defined end-marker, so no issues with being unable to escape the `]]>` token
* ability to disable (comment out) an entire subtree by prefixing it with `-` -- much more convenient and powerful than HTML/XML comments

.jevkoml is best used in combination with the [Jevko CLI](https://github.com/jevko/jevko-cli) -- which gives you additional features, such as:

* self-contained .jevkoml documents that know how to convert themselves to specific HTML/XML files
* ability to wrap the HTML/XML result in a root tag or a sequence of nested tags with top-level attributes applied to the root
* ability to make .jevkoml documents executable thanks to Jevko CLI support for shebangs -- you can convert a document simply by executing it!

<!-- Jevko is closed under concatenation -->

<!-- In the future, JevkoML could also be used directly by various tools, for increased efficiency. -->

## Example

For example, a .jevkoml document like:

<!-- [ ] see a version with syntax highlighting (htmlpreview), [x] get a syntax highlighting extension for visual studio code -->

![screenshot](screenshot.png)

converts into something like this:

```HTML
<html>
  <head>
    <title>This is a title</title>
  </head>
  <body>
    <div>
      <p>Hello world!</p>
      <abbr
        id="anId"
        class="jargon"
        style="color: purple;"
        title="Hypertext Markup Language"
      >HTML</abbr>
      <a href="https://www.wikipedia.org/">
        A link to Wikipedia!
      </a>
      <p>
        Oh well, <span lang="fr">c'est la vie</span>, as they say in France.
      </p>
    </div>
  </body>
</html>
```

See [jevkoml.md](jevkoml.md) for details.

Also see the [.jevkoml syntax highlighting extension for Visual Studio Code](https://github.com/jevko/jevkoml-basic-highlighting-vscode) which was used to produce the screenshot above.

<!-- ## Dependencies

`jevkoml` has one dependency: [Deno](https://deno.land/).

Fortunately Deno is very nice and [easy to install](https://deno.land/manual@v1.28.1/getting_started/installation). -->

<!-- I recommend installing it, as it makes installing and managing `jevkoml` easy and efficient. -->

<!-- todo: better writing -->
# HTML/XML literals

You can enter literal HTML/XML which will not be escaped in the output via `` `'xml' `` or `` `'html' `` heredocs. For example:

```
`'html'
<!doctype html>
<html>
'html'

p [hello]

`'html'
</html>
'html'
```

will produce something like:

```html
<!doctype html>
<html>
<p>hello</p>
</html>
```