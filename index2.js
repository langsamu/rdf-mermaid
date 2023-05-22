import "https://unpkg.com/mermaid@9.1.2/dist/mermaid.min.js"
import "https://unpkg.com/n3@1.16.2/browser/n3.min.js"
import {RdfMermaid} from "./rdf-mermaid.js"
import {suites} from "./suites.js"


mermaid.initialize({startOnLoad: false, useMaxWidth: false, maxTextSize: Number.MAX_VALUE})
addEventListener("load", onLoad)

async function onLoad() {
    for (const {subject, tests} of suites) {
        const suiteDetails = document.body.appendChild(document.createElement("details"))
        const suiteSummary = suiteDetails.appendChild(document.createElement("summary"))
        suiteSummary.innerText = subject
        suiteDetails.setAttribute("open", "")

        for (const test of tests) {
            const testDetails = suiteDetails.appendChild(document.createElement("details"))
            const testSummary = testDetails.appendChild(document.createElement("summary"))
            testSummary.innerText = test.should
            testDetails.test = test

            showIfPreviouslyOpened(testDetails)
            testDetails.addEventListener("toggle", onTestDetailsToggle)
        }
    }
}

function showIfPreviouslyOpened(details) {
    if (localStorage.getItem(`details_${details.test.should}`) !== null) {
        details.setAttribute("open", "")
    }
}

async function onTestDetailsToggle(e) {
    const details = e.target

    if (details.open) {
        localStorage.setItem(`details_${details.test.should}`, "")

        if (!details.querySelector("div[data-processed]")) {
            const dataset = await load(details.test.input)
            const processor = new RdfMermaid(dataset, details.test.config)
            const markdown = await processor.toMermaid()

            const div = details.appendChild(document.createElement("div"))
            div.innerHTML = markdown

            mermaid.init(undefined, div)

            div.querySelector("svg").removeAttribute("width")
        }
    } else {
        localStorage.removeItem(`details_${details.test.should}`)
    }
}

function load(rdf) {
    const dataset = new N3.Store()
    const graph = new N3.Parser().parse(rdf)

    dataset.addQuads(graph)

    return dataset
}