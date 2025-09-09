export class GraphNode {
    /**
     * @param {Object} params
     * @param {string} params.id - Unique node ID
     * @param {{x:number, y:number}} [params.position={x:0, y:0}] - Screen position
     * @param {string} [params.color="#333"] - Card background color
     * @param {string} [params.caption=""] - Caption text at bottom of the card
     * @param {Array<{text:string, color:string}>} [params.labels=[]] - Card labels
     * @param {Object} [params.properties={}] - Key-value card properties
     * @param {number} [params.width=300] - Card width
     */
    constructor({
        id,
        position = { x: 0, y: 0 },
        color = "#333",
        caption = "",
        labels = [],
        properties = {},
        width = 300,
    }) {
        this.id = id;
        this.position = { ...position };
        this.color = color;
        this.caption = caption;
        this.labels = [...labels];
        this.properties = { ...properties };
        this.width = width;
        // UI/interaction state (not serialized)
        this.selected = false;
        this.propertiesExpanded = false;
    }
}
