// src/interaction/InteractionStateMachine.js
export class InteractionStateMachine {
    constructor() {
      this.currentState = 'idle';
      this.states = {
        idle: new IdleState(),
        selecting: new SelectingState(),
        panning: new PanningState(),
        zooming: new ZoomingState(),
        dragging: new DraggingState(),
        multiSelect: new MultiSelectState()
      };
      
      // Interaction context
      this.context = {
        selectedNodes: new Set(),
        dragStartPos: null,
        panStartPos: null,
        zoomCenter: null,
        modifierKeys: { ctrl: false, shift: false, alt: false }
      };
    }
  
    transition(event, context) {
      const currentStateObj = this.states[this.currentState];
      const nextState = currentStateObj.handleEvent(event, context);
      
      if (nextState && nextState !== this.currentState) {
        // Exit current state
        currentStateObj.exit?.(context);
        
        // Enter new state
        this.currentState = nextState;
        this.states[nextState].enter?.(context);
      }
      
      return this.currentState;
    }
}
