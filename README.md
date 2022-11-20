# jevkoml

Converts JevkoML -- a Jevko markup format -- to HTML.

## Example

For example, it will convert this:

<!-- see a version with syntax highlighting (htmlpreview), get a syntax highlighting extension for visual studio code -->

```jevko
html [
  head [
    title [This is a title]
  ]
  body [
    div [
      p [Hello world!]
      abbr [
        id=[anId]
        class=[jargon]
        style=[color: purple;]
        title=[Hypertext Markup Language]
      HTML]
      a [href=[https://www.wikipedia.org/]
        A link to Wikipedia!
      ]
      p [
        Oh well, \span [lang=[fr]c'est la vie], as they say in France.
      ]
    ]
  ]
]
```

into this:

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

excepting some indentation in the output.

See [jevkoml.md](jevkoml.md) for details.

## Get the latest binary release

Following these instructions, you will get a single `jevkoml` executable which includes all dependencies.

1. Download the latest binary release .zip from GitHub for your system:

* [Linux x64](https://github.com/jevko/jevkoml/releases/latest/download/jevkoml-linux-x64.zip)
* [Windows x64](https://github.com/jevko/jevkoml/releases/latest/download/jevkoml-windows-x64.zip)
* [macOS x64](https://github.com/jevko/jevkoml/releases/latest/download/jevkoml-macos-x64.zip)
* [macOS ARM](https://github.com/jevko/jevkoml/releases/latest/download/jevkoml-macos-arm.zip)

2. Unzip the archive, e.g.:

```
unzip jevkoml-linux-x64.zip
```

3. Done.

You can now use the `jevkoml` executable as described in [Usage](#usage).

You can also [install it on your system](#installation) to be able to invoke it as `jevkoml` from anywhere.

*Note: the above binaries were [built with Deno](#build-a-self-contained-executable) on Linux. The Linux binary was tested and confirmed functional. The rest of the binaries were not tested, but should work insofar as `deno compile` works. If you encounter any issues (or confirm that it works on your system), please [file an issue on GitHub](https://github.com/jevko/jevkoml/issues).*

## Usage

If `jevkoml` is [installed](#installation) you can invoke it as:

```
jevkoml
```

otherwise instead of `jevkoml` use the path that points to the executable:

```bash
./jevkoml # if jevkoml in current directory
/path/to/jevkoml # if jevkoml under /path/to/jevkoml
```

Without arguments, `jevkoml` will accept input from standard input until you press CTRL+D.

<!-- todo?: mvp console highlighting? -->

You can also provide a path to a file as an argument:

<!-- get syntax highlighting for vscode -->

```
jevkoml filename.jevkoml
```

This will convert a file named `filename.jevkoml` into HTML and output the result to standard output.

You can redirect the output to a file like this:

```
jevkoml filename.jevkoml > outputfile.html
```

Alternatively, you can put an `/output` directive with the output file name at the top of the input file:

```
/output [outputfile.html]
```

now if you run:

```
jevkoml filename.jevkoml
```

it will output to `outputfile.html` instead of standard output.

## Installation

To install the `jevkoml` executable in your system, place it in a directory that appears in your `PATH` variable.

You can get a list of these directories by running:

```
echo $PATH
```

This should print something like:

```
/home/myusername/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin
```

To move the `jevkoml` executable into `/home/myusername/.local/bin/` we can run:

```
mv jevkoml /home/myusername/.local/bin/
```

Now it can be invoked as `jevkoml` from anywhere.

## Uninstall the executable from your system

Delete `jevkoml` from the installation directory:

```
rm /home/myusername/.local/bin/jevkoml
```

## Build or run with Deno

*This is an alternative to using the executable version above.*

### Dependencies

Depends on [Deno](https://deno.land/). 

[Deno installation instructions](https://deno.land/manual@v1.28.1/getting_started/installation).

### Run without installation

```
sh run.sh filename.jevkoml
```

or:

```
deno run --allow-read --allow-run --allow-write jevkoml.js filename.jevkoml
```

### Build a self-contained executable

To get a single `jevkoml` executable with all dependencies baked in:

```
sh build.sh
```

or:

```
deno compile --output jevkoml --allow-read --allow-run --allow-write jevkoml.js
```

The executable can now be [installed](#installation) or [used](#usage) as-is.

## Deno install

<!-- todo -->

```
deno install --root ~/.local/ --name jevkoml --allow-read --allow-run --allow-write jevkoml.js
```

<!-- ```
ℹ️  Add /home/USER/.deno/bin to PATH
    export PATH="/home/USER/.deno/bin:$PATH"
``` -->