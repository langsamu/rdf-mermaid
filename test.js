import "https://unpkg.com/n3@1.16.2/browser/n3.min.js"
import {RdfMermaid} from "./rdf-mermaid.js"
import {suites} from "./suites.js"

for (const {subject, tests} of suites) {
    describe(subject, withSpecs)

    function withSpecs() {
        for (const {should, input, config, output} of tests) {
            it(should, pass)

            async function pass() {
                const rdf = load(input)
                const processor = new RdfMermaid(rdf, config)
                const actual = await processor.toMermaid()

                if (output instanceof RegExp) {
                    expect(actual).toMatch(output)
                } else {
                    expect(actual).toEqual(output)
                }
            }
        }
    }
}

function load(rdf) {
    const dataset = new N3.Store()
    const graph = new N3.Parser().parse(rdf)

    dataset.addQuads(graph)

    return dataset
}