export class GraphEdge {
    /**
     * @param {Object} params
     * @param {string} params.id - Unique edge ID
     * @param {Object} [params.type={}] - Type(s) and color(s) of relationship, e.g. { related: "#ffe25a" }
     * @param {number} [params.weight=1] - Edge weight (thickness/influence)
     * @param {string} params.fromId - Source node ID
     * @param {string} params.toId - Target node ID
     */
    constructor({
        id,
        type = {},
        weight = 1,
        fromId,
        toId
    }) {
        this.id = id;
        this.type = { ...type };
        this.weight = weight;
        this.fromId = fromId;
        this.toId = toId;
        // Optionally for rendering:
        this.bezierPoints = null;
    }
}
