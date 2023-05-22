export const suites = [
    {
        subject: "Type inlining",
        tests: [
            {
                should: "Literal never inlined",
                input: `[a ""] .`,
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    l1["&ZeroWidthSpace;"]

    r1 --"<code>rdf:type</code>"--> l1`
            },
            {
                should: "Unlabelled blank never inlined",
                input: `[a []] .`,
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    r2(["&ZeroWidthSpace;"])

    r1 --"<code>rdf:type</code>"--> r2`
            },
            {
                should: "Labelled blank inlined",
                input: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

[a [rdfs:label "label"]; <p> <o>] .`,
                output: `graph LR
    r1(["<i>a <q>label</q></i>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code>"--> r2`
            },
            {
                should: "Labelled blank not inlined when label inlining disabled",
                input: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

[a [rdfs:label "label"]; <p> <o>] .`,
                config: {inlineLabels: false},
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    l1["<b>label</b>"]
    r2(["&ZeroWidthSpace;"])
    r3(["<b><code>o</code></b>"])

    r1 --"<code>rdfs:label</code>"--> l1
    r2 --"<code>rdf:type</code>"--> r1
    r2 --"<code>p</code>"--> r3`
            },
            {
                should: "Not inlined for orphan subject",
                input: "<s> a <C> .",
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>C</code></b>"])

    r1 --"<code>rdf:type</code>"--> r2`
            },
            {
                should: "Type not inlined when disabled",
                input: `[a <Class>; <p> <o>] .`,
                config: {
                    inlineTypes: false
                },
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    r2(["<b><code>Class</code></b>"])
    r3(["<b><code>o</code></b>"])

    r1 --"<code>rdf:type</code>"--> r2
    r1 --"<code>p</code>"--> r3`
            },
        ]
    },
    {
        subject: "Graph inlining",
        tests: [
            {
                should: "Default graph never inlined",
                input: `<s> <p> <o> .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code>"--> r2`
            },
            {
                should: "Edges from different graphs differ",
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<s> <p> <o> .

<g2> {
    <s> <p> <o> .
}
`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code>"--> r2
    r1 --"<code>p</code><hr><i><code>g2</code></i>"--> r2`
            },
            {
                should: "Blank node ID inlined for unlabelled blank graph",
                input: `[] { <s> <p> <o> }`,
                output: /^graph LR\n    r1\(\["<b><code>s<\/code><\/b>"]\)\n    r2\(\["<b><code>o<\/code><\/b>"]\)\n\n    r1 --"<code>p<\/code><hr><i>_:.+<\/i>"--> r2$/
            },
            {
                should: "Uri graph inlined",
                input: `<g> { <s> <p> <o> }`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code><hr><i><code>g</code></i>"--> r2`
            },
            {
                should: "Labels inlined for blank graph",
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

_:g {
    <s> <p> <o> .
}

_:g rdfs:label "label1", "label2" .
`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code><hr><i><q>label1</q><br><q>label2</q></i>"--> r2`
            },
            {
                should: "Labels inlined for IRI graph",
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<g> {
    <s> <p> <o> .
}

<g> rdfs:label "g", "q" .
`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code><hr><i><q>g</q><br><q>q</q></i>"--> r2`
            },
            {
                should: "Graph labels not inlined when disabled",
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<g> {
    <s> <p> <o> .
}

<g> rdfs:label "g", "q" .
`,
                config: {inlineLabels: false},
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])
    r3(["<b><code>g</code></b>"])
    l1["<b>g</b>"]
    l2["<b>q</b>"]

    r1 --"<code>p</code><hr><i><code>g</code></i>"--> r2
    r3 --"<code>rdfs:label</code>"--> l1
    r3 --"<code>rdfs:label</code>"--> l2`,
            },
            {
                should: "Graph not inlined when disabled",
                config: {inlineGraphs: false},
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<g1> {
    <s> <p> <o> .
}

<g2> {
    <s> <p> <o> .
}
`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code>"--> r2
    r1 --"<code>p</code>"--> r2`
            },
        ]
    },
    {
        subject: "Lists",
        tests: [
            {
                should: "Empty list not hidden",
                input: `<s> <p> () .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>rdf:nil</code></b>"])

    r1 --"<code>p</code>"--> r2`
            },
            {
                should: "Rest nil hidden",
                input: `<s> <p> (<o>) .`,
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    r2(["<b><code>o</code></b>"])
    r3(["<b><code>s</code></b>"])

    r1 --"<code>rdf:first</code>"--> r2
    r3 --"<code>p</code>"--> r1`
            },
            {
                should: "Rest nil not hidden when disabled",
                input: `<s> <p> (<o>) .`,
                config: {hideRestNil: false},
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    r2(["<b><code>o</code></b>"])
    r3(["<b><code>rdf:nil</code></b>"])
    r4(["<b><code>s</code></b>"])

    r1 --"<code>rdf:first</code>"--> r2
    r1 --"<code>rdf:rest</code>"--> r3
    r4 --"<code>p</code>"--> r1`
            },
            {
                should: "Rest nil hidden for nested lists",
                input: `<s> <p> (<o1> (<o2>)) .`,
                output: `graph LR
    r1(["&ZeroWidthSpace;"])
    r2(["<b><code>o1</code></b>"])
    r3(["&ZeroWidthSpace;"])
    r4(["&ZeroWidthSpace;"])
    r5(["<b><code>o2</code></b>"])
    r6(["<b><code>s</code></b>"])

    r1 --"<code>rdf:first</code>"--> r2
    r1 --"<code>rdf:rest</code>"--> r3
    r3 --"<code>rdf:first</code>"--> r4
    r4 --"<code>rdf:first</code>"--> r5
    r6 --"<code>p</code>"--> r1`
            },
        ]
    },
    {
        subject: "Literals",
        tests: [
            {
                should: "Renders plain string literals",
                input: `<s> <p> "literal" .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>literal</b>"]

    r1 --"<code>p</code>"--> l1`
            },
            {
                should: "Renders language tag",
                input: `<s> <p> "literal"@en .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>literal</b><hr><i>@en</i>"]

    r1 --"<code>p</code>"--> l1`
            },
            {
                should: "Renders datatype",
                input: `<s> <p> "literal"^^<dt> .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>literal</b><hr><i>^^<code>dt</code></i>"]

    r1 --"<code>p</code>"--> l1`
            },
            {
                should: "Resolves datatype IRIs",
                input: `<s> <p> 0 .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>0</b><hr><i>^^<code>xsd:integer</code></i>"]

    r1 --"<code>p</code>"--> l1`
            },
            {
                should: "Doesn't resolve datatype IRIs when disabled",
                input: `<s> <p> 0 .`,
                config: {resolveNamespaces: false},
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>0</b><hr><i>^^<code>http://www.w3.org/2001/XMLSchema#integer</code></i>"]

    r1 --"<code>p</code>"--> l1`
            },
            {
                should: "Resolves datatype labels",
                input: `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<s> <p> "literal"^^<dt> .
<dt> rdfs:label "dt label" .
`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    l1["<b>literal</b><hr><i>^^<q>dt label</q></i>"]

    r1 --"<code>p</code>"--> l1`
            },
        ]
    },
    {
        subject: "IRIs",
        tests: [
            {
                should: "Renders relative IRIs",
                input: `<s> <p> <o> .`,
                output: `graph LR
    r1(["<b><code>s</code></b>"])
    r2(["<b><code>o</code></b>"])

    r1 --"<code>p</code>"--> r2`
            },
            {
                should: "Renders absolute IRIs",
                input: `<http://s> <http://p> <http://o> .`,
                output: `graph LR
    r1(["<b><code>http://s</code></b>"])
    r2(["<b><code>http://o</code></b>"])

    r1 --"<code>http://p</code>"--> r2`
            },
            {
                should: "Renders URN IRIs",
                input: `<urn:example:s> <urn:example:p> <urn:example:o> .`,
                output: `graph LR
    r1(["<b><code>urn:example:s</code></b>"])
    r2(["<b><code>urn:example:o</code></b>"])

    r1 --"<code>urn:example:p</code>"--> r2`
            },
            {
                should: "Resolves specific IRIs",
                input: `<urn:example:s> <urn:example:p> <urn:example:o> .`,
                config: {prefixMapping: {"urnex": "urn:example:"}},
                output: `graph LR
    r1(["<b><code>urnex:s</code></b>"])
    r2(["<b><code>urnex:o</code></b>"])

    r1 --"<code>urnex:p</code>"--> r2`
            },
            {
                should: "Doesn't resolve specific IRIs when disabled",
                input: `<urn:example:s> <urn:example:p> <urn:example:o> .`,
                config: {resolveNamespaces: false, prefixMapping: {"urnex": "urn:example:"}},
                output: `graph LR
    r1(["<b><code>urn:example:s</code></b>"])
    r2(["<b><code>urn:example:o</code></b>"])

    r1 --"<code>urn:example:p</code>"--> r2`
            },
            {
                should: "Resolves prefix.cc IRIs",
                input: `<http://www.w3.org/2000/01/rdf-schema#Class> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <http://www.w3.org/2000/01/rdf-schema#Resource> .`,
                output: `graph LR
    r1(["<b><code>rdfs:Class</code></b>"])
    r2(["<b><code>rdfs:Resource</code></b>"])

    r1 --"<code>rdfs:subClassOf</code>"--> r2`
            },
            {
                should: "Doesn't resolves prefix.cc IRIs when disabled",
                input: `<http://www.w3.org/2000/01/rdf-schema#Class> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <http://www.w3.org/2000/01/rdf-schema#Resource> .`,
                config: {resolvePrefixCcNamespaces: false},
                output: `graph LR
    r1(["<b><code>http://www.w3.org/2000/01/rdf-schema#Class</code></b>"])
    r2(["<b><code>http://www.w3.org/2000/01/rdf-schema#Resource</code></b>"])

    r1 --"<code>http://www.w3.org/2000/01/rdf-schema#subClassOf</code>"--> r2`
            },
            {
                should: "Doesn't resolves prefix.cc IRIs when resolving namespaces disabled",
                input: `<http://www.w3.org/2000/01/rdf-schema#Class> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <http://www.w3.org/2000/01/rdf-schema#Resource> .`,
                config: {resolveNamespaces: false},
                output: `graph LR
    r1(["<b><code>http://www.w3.org/2000/01/rdf-schema#Class</code></b>"])
    r2(["<b><code>http://www.w3.org/2000/01/rdf-schema#Resource</code></b>"])

    r1 --"<code>http://www.w3.org/2000/01/rdf-schema#subClassOf</code>"--> r2`
            },
        ]
    },
]