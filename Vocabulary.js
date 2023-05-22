import DataFactory from "https://unpkg.com/@rdfjs/data-model@2.0.1/Factory.js"

const factory = new DataFactory

export class Rdf {
    static get ns() {
        return "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    }

    static get prefix() {
        return "rdf"
    }

    static get type() {
        return namedNode(this.ns, "type")
    }

    static get first() {
        return namedNode(this.ns, "first")
    }

    static get rest() {
        return namedNode(this.ns, "rest")
    }

    static get nil() {
        return namedNode(this.ns, "nil")
    }

    static get langString() {
        return namedNode(this.ns, "langString")
    }
}

export class Schema {
    static get ns() {
        return "http://schema.org/"
    }

    static get prefix() {
        return "schema"
    }

    static get name() {
        return namedNode(this.ns, "name")
    }
}

export class Dc {
    static get ns() {
        return "http://purl.org/dc/terms/"
    }

    static get prefix() {
        return "dc"
    }

    static get title() {
        return namedNode(this.ns, "title")
    }
}

export class Xsd {
    static get ns() {
        return "http://www.w3.org/2001/XMLSchema#"
    }

    static get prefix() {
        return "xsd"
    }

    static get string() {
        return namedNode(this.ns, "string")
    }
}

export class Rdfs {
    static get ns() {
        return "http://www.w3.org/2000/01/rdf-schema#"
    }

    static get prefix() {
        return "rdfs"
    }

    static get label() {
        return namedNode(this.ns, "label")
    }
}

export class Foaf {
    static get ns() {
        return "http://xmlns.com/foaf/0.1/"
    }

    static get name() {
        return namedNode(this.ns, "name")
    }
}

export class RdfJs {
    static get named() {
        return "NamedNode"
    }

    static get blank() {
        return "BlankNode"
    }

    static get literal() {
        return "Literal"
    }
}

export class JsonLd {
    static    get context() {
        return "@context"
    }
}

export class PrefixCc {
    static get context() {
        return "https://prefix.cc/context"
    }
}

function namedNode(namespace, name) {
    return factory.namedNode(namespace + name)
}