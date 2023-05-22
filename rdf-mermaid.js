import {Dc, JsonLd, PrefixCc, Rdf, RdfJs, Rdfs, Schema, Xsd, Foaf} from "./Vocabulary.js"
import DataFactory from "https://unpkg.com/@rdfjs/data-model@2.0.1/Factory.js"

const defaultGraph = new DataFactory().defaultGraph()

const defaultConfig = {
    inlineLabels: true,
    inlineTypes: true,
    inlineGraphs: true,
    hideRestNil: true,
    resolveNamespaces: true,
    resolvePrefixCcNamespaces: true,

    labelProperties: [Rdfs.label, Schema.name, Dc.title, Foaf.name],
    orientation: "LR",
    prefixMapping: {},
    ignoredProperties: []
}

export class RdfMermaid {
    #config
    #dataset

    constructor(dataset, config) {
        this.#dataset = dataset
        this.#config = Object.assign({}, defaultConfig, config)
    }

    async toMermaid() {
        this.#config.prefixMapping = Object.entries(this.#config.prefixMapping).sort(RdfMermaid.#byLongestValue).concat(await this.#getPrefixCcMappings())

        const lines = []

        const nodes = new Set
        const resourceMapping = new Map

        let literalCounter = 0
        const literalCounterInc = () => ++literalCounter

        let resourceCounter = 0
        const resourceCounterInc = () => ++resourceCounter

        for (const q of this.#dataset) {
            if (this.#shouldProcess(q)) {
                const s = this.#memoize(q.subject, nodes, resourceMapping, literalCounterInc, resourceCounterInc)
                const p = this.#edgeLabel(q)
                const o = this.#memoize(q.object, nodes, resourceMapping, literalCounterInc, resourceCounterInc)

                lines.push(`    ${s} --"${p}"--> ${o}`)
            }
        }

        const graph = `graph ${this.#config.orientation}`
        return [graph, ...nodes, undefined, ...lines].join("\n")
    }

    #shouldProcess(quad) {
        if (this.#shouldIgnoreTypeStatement(quad)) {
            return false
        }

        if (this.#shouldIgnoreProperty(quad)) {
            return false
        }

        if (this.#shouldIgnoreRestNil(quad)) {
            return false
        }

        if (this.#shouldIgnoreLabelStatement(quad)) {
            return false
        }

        return true
    }

    #shouldIgnoreProperty(quad) {
        if (this.#config.ignoreProperties == null) {
            return false
        }

        if (typeof this.#config.ignoreProperties[Symbol.iterator] !== typeof Function) {
            return false
        }

        for (const property of this.#config.ignoreProperties) {
            if (quad.predicate.equals(property)) {
                return true
            }
        }

        return false
    }

    #shouldIgnoreTypeStatement(quad) {
        if (!this.#config.inlineTypes) {
            return false
        }

        if (!quad.predicate.equals(Rdf.type)) {
            return false
        }

        if (quad.object.termType === RdfJs.literal) {
            return false
        }

        return this.#shouldIgnoreXXX(quad)
    }

    #shouldIgnoreXXX(quad) {
        if (quad.object.termType === RdfJs.blank) {
            if (!this.#config.inlineLabels || this.#nodeLabels(quad.object) === null) {
                return false
            }
        }

        for (const match of this.#dataset.match(quad.subject)) {
            if (!match.predicate.equals(Rdf.type)) {
                return true
            }
        }

        return false
    }

    #shouldIgnoreLabelStatement(quad) {
        if (!this.#config.inlineLabels) {
            return false
        }

        for (const labelProperty of this.#config.labelProperties) {
            if (quad.predicate.equals(labelProperty)) {
                return true
            }
        }

        return false
    }

    #shouldIgnoreRestNil(quad) {
        if (!this.#config.hideRestNil) {
            return false
        }

        if (!quad.predicate.equals(Rdf.rest)) {
            return false
        }

        if (!quad.object.equals(Rdf.nil)) {
            return false
        }

        return true
    }

    async #getPrefixCcMappings() {
        if (!this.#config.resolvePrefixCcNamespaces) {
            return []
        }

        if (!localStorage.getItem("prefixCcCache")) {
            try {
                const response = await fetch(PrefixCc.context)
                if (!response.ok) {
                    console.warn("RDF-mermaid failed to fetch prefix.cc context with status [%s]", response.status)
                    return []
                }

                const json = await response.json()
                const context = json[JsonLd.context];
                const entries = Object.entries(context)
                const sorted = entries.sort(RdfMermaid.#byLongestValue)

                localStorage.setItem("prefixCcCache", JSON.stringify(sorted))

            } catch (e) {
                console.warn("RDF-mermaid failed to fetch prefix.cc context with error [%s]", e)
                return []
            }
        }

        return JSON.parse(localStorage.getItem("prefixCcCache"))
    }

    #memoize(node, nodes, resourceMapping, newLiteral, newResource) {
        switch (node.termType) {
            case RdfJs.named:
            case RdfJs.blank:
                const label = this.#nodeLabel(node)

                if (!resourceMapping.has(node.value)) {
                    resourceMapping.set(node.value, `r${newResource()}`)
                }
                const id = resourceMapping.get(node.value)

                nodes.add(`    ${id}(["${label}"])`)

                return id

            case RdfJs.literal:
                const literalLabel = this.#nodeLabel(node)

                const literalId = `l${newLiteral()}`
                if (literalLabel) {
                    nodes.add(`    ${literalId}["${literalLabel}"]`)
                }

                return literalId;
        }
    }

    #nodeLabel(node) {
        console.log("nodeLabel",node)
        const result = []

        const upper = this.#nodeUpper(node)
        if (upper) {
            result.push(`<b>${upper}</b>`)
        }

        const lower = this.#nodeLower(node)
        if (lower) {
            result.push(`<i>${lower}</i>`)
        }

        if (result.length === 0) {
            result.push("&ZeroWidthSpace;")
        }

        return result.filter(x => !!x).join("<hr>") || null
    }

    #edgeLabel(quad) {
        console.log("edgeLabel",quad)
        const results = []

        results.push(this.#nodeUpper(quad.predicate))

        if (this.#config.inlineGraphs) {
            if (!quad.graph.equals(defaultGraph)) {
                let items = this.#nodeUpper(quad.graph);

                if (items === "") {
                    items = `_:${quad.graph.value}`
                }

                results.push(`<i>${items}</i>`)
            }
        }

        console.log("edgeLabel return",quad,results.filter(result => !!result).join("<hr>") || null)
        return results.filter(result => !!result).join("<hr>") || null
    }

    #nodeLower(node) {
        switch (node.termType) {
            case RdfJs.literal:
                if (node.datatype.equals(Rdf.langString)) {
                    return `@${node.language}`
                }

                if (!node.datatype.equals(Xsd.string)) {
                    return `^^${this.#nodeUpper(node.datatype)}`
                }

                return ""

            case RdfJs.named:
            case RdfJs.blank:
                // if (this.#config.inlineTypes) {
                return this.#nodeTypes(node)
            // }

            // return
        }
    }

    #nodeTypes(node) {
        if (!this.#config.inlineTypes) {
            return
        }

        const types = this.#dataset.match(node, Rdf.type)
        const result = []

        for (const typeStatement of types) {
            if (!this.#shouldIgnoreXXX(typeStatement)) {
                continue
            }

            result.push(`a ${this.#nodeUpper(typeStatement.object)}`)
        }

        return result.filter(y => !!y).join("<br>") || null
    }

    #nodeUpper(node) {
        console.log("nodeUpper",node)
        const results = []

        switch (node.termType) {
            case RdfJs.literal:
                results.push(RdfMermaid.#escape(node))

                break

            default:
                const labels = this.#nodeLabels(node);
                results.push(labels)

                if (!labels) {
                    results.push(this.#nodeIri(node))
                }

                break
        }

        console.log("nodeUpper return",node,results.filter(xx => !!xx).join("<br>"))
        return results.filter(xx => !!xx).join("<br>")
    }

    #nodeLabels(node) {
        if (!this.#config.inlineLabels) {
            return
        }

        const results = []

        for (const labelProperty of this.#config.labelProperties) {
            const labels = this.#dataset.match(node, labelProperty)

            for (const labelStatement of labels) {
                results.push(`<q>${RdfMermaid.#escape(labelStatement.object)}</q>${this.#nodeLower(labelStatement.object)}`)
            }
        }

        return [...(new Set(results.filter(result => !!result)))].join("<br>") || null
    }

    #nodeIri(node) {
        if (node.termType !== RdfJs.named) {
            return null
        }

        return `<code>${this.#resolveNamespace(node)}</code>`
    }

    #resolveNamespace(node) {
        if (!this.#config.resolveNamespaces) {
            return node.value
        }

        if (node.termType === RdfJs.named) {
            for (const [prefix, namespace] of this.#config.prefixMapping) {
                if (node.value.startsWith(namespace)) {
                    return node.value.replace(namespace, `${prefix}:`)
                }
            }
        }

        return node.value
    }

    static #escape(node) {
        return node.value.replaceAll(/["<>]/g, c => `#${c.codePointAt(0)};`)
    }

    static #byLongestValue([, {length: a}], [, {length: b}]) {
        return b - a
    }
}