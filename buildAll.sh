rm -r bin

mkdir -p bin/jevkoml-linux-x64
mkdir -p bin/jevkoml-windows-x64
mkdir -p bin/jevkoml-macos-x64
mkdir -p bin/jevkoml-macos-arm

deno compile --target x86_64-unknown-linux-gnu --output bin/jevkoml-linux-x64/jevkoml --allow-read --allow-run --allow-write main.js

deno compile --target x86_64-pc-windows-msvc --output bin/jevkoml-windows-x64/jevkoml --allow-read --allow-run --allow-write main.js

deno compile --target x86_64-apple-darwin --output bin/jevkoml-macos-x64/jevkoml --allow-read --allow-run --allow-write main.js

deno compile --target aarch64-apple-darwin --output bin/jevkoml-macos-arm/jevkoml --allow-read --allow-run --allow-write main.js

zip -j -9 bin/jevkoml-linux-x64.zip bin/jevkoml-linux-x64/jevkoml
zip -j -9 bin/jevkoml-windows-x64.zip bin/jevkoml-windows-x64/jevkoml.exe
zip -j -9 bin/jevkoml-macos-x64.zip bin/jevkoml-macos-x64/jevkoml
zip -j -9 bin/jevkoml-macos-arm.zip bin/jevkoml-macos-arm/jevkoml