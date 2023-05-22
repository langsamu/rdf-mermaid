// import "./mermaid.min.js"
// import "./n3.min.js"
import {RdfMermaid} from "./rdf-mermaid.js"
import "https://unpkg.com/mermaid@9.1.2/dist/mermaid.min.js"
import "https://unpkg.com/n3@1.16.2/browser/n3.min.js"


mermaid.initialize({startOnLoad: false, useMaxWidth: false, maxTextSize: Number.MAX_VALUE})
addEventListener("load", onLoad)

async function onLoad() {
    const params = new URLSearchParams(location.search)
    const iri = params.get("iri")
    if (iri) {
        const inlineLabels = params.get("inlineLabels")
        const inlineTypes = params.get("inlineTypes")
        const inlineGraphs = params.get("inlineGraphs")
        const hideRestNil = params.get("hideRestNil")
        const resolveNamespaces = params.get("resolveNamespaces")
        const resolvePrefixCcNamespaces = params.get("resolvePrefixCcNamespaces")
        const orientation = params.get("orientation")

        document.getElementById("iri").value = iri
        document.getElementById("inlineLabels").checked = inlineLabels === "on"
        document.getElementById("inlineTypes").checked = inlineTypes === "on"
        document.getElementById("inlineGraphs").checked = inlineGraphs === "on"
        document.getElementById("hideRestNil").checked = hideRestNil === "on"
        document.getElementById("resolveNamespaces").checked = resolveNamespaces === "on"
        document.getElementById("resolvePrefixCcNamespaces").checked = resolvePrefixCcNamespaces === "on"
        if (orientation) {
            document.getElementById("orientation").value = orientation
        }

        const g = await load(iri)
        if (g === null) {
            console.warn("RDF-mermaid got no dataset for IRI [%s]", iri)
            return
        }

        const config = {
            inlineLabels: inlineLabels === "on",
            inlineTypes: inlineTypes === "on",
            inlineGraphs: inlineGraphs === "on",
            hideRestNil: hideRestNil === "on",
            resolveNamespaces: resolveNamespaces === "on",
            resolvePrefixCcNamespaces: resolvePrefixCcNamespaces === "on",
            prefixMapping: {
                "ex": "http://example.com/",
            },
            ignoreProperties: [N3.DataFactory.namedNode("http://www.w3.org/2000/01/rdf-schema#isDefinedBy")]
        }
        if (orientation) {
            config.orientation = orientation
        }

        const markdown = await new RdfMermaid(g, config).toMermaid()
        console.log(markdown)

        const div = document.body.appendChild(document.createElement("div"))
        div.innerHTML = markdown

        try {
            await mermaid.parse(markdown)
        } catch (e) {
            console.warn("RDF-mermaid generated Mermaid is invalid: [%s]", e.str)
            return
        }

        mermaid.init(undefined, div)

        div.querySelector("svg").removeAttribute("width")
        document.getElementById("diagram").scrollIntoView()
    }
}

async function load(iri) {
    let r
    try {
        const x = "application/n-quads,application/trig;q=0.95,application/ld+json;q=0.9,application/n-triples;q=0.8,*/*;q=0.1"
        r = await fetch(iri, {headers: {Accept: x}})
        if (!r.ok) {
            console.warn("RDF-mermaid failed to fetch IRI [%s] RDF with status [%s]", iri, r.status)
            return null
        }
    } catch (e) {
        console.warn("RDF-mermaid failed to fetch IRI [%s] with CORS error", iri)
        return null
    }

    const rdf = await r.text()

    const dataset = new N3.Store()

    try {
        const graph = new N3.Parser().parse(rdf)
        dataset.addQuads(graph)

        return dataset
    } catch (e) {
        console.warn("RDF-mermaid failed to parse RDF with [%o]", e)
        return null
    }
}