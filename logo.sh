# Remove the current logo files
rm -f ./src/assets/logo.svg
rm -f ./src/assets/logo.png

# Get the Amazon Translate icon from the web and pipe it into an svg file
curl -XGET 'https://d2q66yyjeovezo.cloudfront.net/icon/fc46e26a907870744758b76166150f62-76c22bfd03882310f44da5a6a9590864.svg' > ./src/assets/logo.svg

# Convert the svg to a png for use as the extension icon
./node_modules/.bin/svg2png ./src/assets/logo.svg -o ./src/assets/logo.png