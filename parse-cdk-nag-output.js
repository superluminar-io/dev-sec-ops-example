const fs = require('fs')
const readline = require('readline')
const yaml = require('js-yaml')

const inputFile = 'cdk-synth-errors.log'
const outputFile = 'cdk-nag-annotations.yaml'

const rl = readline.createInterface({
  input: fs.createReadStream(inputFile),
  output: process.stdout,
  terminal: false,
})

const annotations = {}

rl.on('line', (line) => {
  const match = line.match(/^\[(Error|Warning) at (.*)\] (.*)$/)
  if (match) {
    const [, , location, message] = match
    if (!annotations[location]) {
      annotations[location] = []
    }
    // eslint-disable-next-line security/detect-object-injection
    annotations[location].push(message)
  }
})

rl.on('close', () => {
  const groupedAnnotations = Object.keys(annotations).map((location) => ({
    location,
    // eslint-disable-next-line security/detect-object-injection
    messages: annotations[location],
  }))
  const yamlStr = yaml.dump(groupedAnnotations)
  const yamlWithBreaks = yamlStr.replace(/^- location:/gm, '\n\n- location:')
  fs.writeFileSync(outputFile, yamlWithBreaks.trim())
  console.log(`Annotations written to ${outputFile}`)
})
