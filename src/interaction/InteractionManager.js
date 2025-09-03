// InteractionManager.js
import { createMachine, interpret, assign } from 'xstate';

export class EventBus {
  constructor() { this.listeners = {}; }
  on(type, cb) { (this.listeners[type] ||= []).push(cb); }
  off(type, cb) { this.listeners[type] = (this.listeners[type] || []).filter(fn => fn !== cb); }
  emit(type, ...args) { 

    (this.listeners[type] || []).forEach(fn => fn(...args)); 
  }
}

function createInteractionMachine(context = {}) {
  const eventBus = context.eventBus;
  return createMachine({
    id: 'interaction',
    initial: 'idle',
    context,
    states: {
      idle: {
        on: {
          POINTER_DOWN: [
            { target: 'draggingNode', guard: 'onNode', actions: 'setStart' },
            { target: 'panning', actions: 'setStart' }
          ],
          POINTER_MOVE: [],
          POINTER_UP: [],
        },
      },
      draggingNode: {
        entry: 'notifyDragStart',
        on: {
          POINTER_MOVE: { actions: ['updateLastEvent', 'dragNode'] },
          POINTER_UP: { target: 'idle', actions: ['finishDrag', 'clearTemp'] }
        }
      },
      panning: {
        entry: 'notifyPanStart',
        on: {
          POINTER_MOVE: { actions: ['updateLastEvent', 'updatePan'] },
          POINTER_UP: { target: 'idle', actions: ['finishPan', 'clearTemp'] },
        },
      }
    }
  }, {
    guards: {
      onNode: (_ctx, evt) => {

        if (!evt || !evt.target) return false;
        return evt.target.type === 'node';
      }
    },
    actions: {
      setStart: assign((ctx, evt) => {
        if (!evt) return { ...ctx, start: null, node: null, eventBus: eventBus };
        return { ...ctx, start: evt?.world ?? null, node: evt?.target?.node, eventBus: eventBus, lastEvent: evt };
      }),
      clearTemp: assign(ctx => ({ ...ctx, start: undefined, node: undefined, lastEvent: undefined, eventBus: eventBus })),
      updateLastEvent: assign((ctx, evt) => {

        return { ...ctx, lastEvent: evt, eventBus: eventBus };
      }),
      notifyDragStart: ctx => { 
        if (eventBus?.emit) eventBus.emit('dragStart', ctx);
      },
      dragNode: (ctx, evt) => {

        const currentEvent = evt || ctx.lastEvent;
        if (!currentEvent || !currentEvent.world) return;
        if (eventBus?.emit) eventBus.emit('drag', { node: ctx.node, pos: currentEvent.world });
      },
      finishDrag: ctx => { 

        if (eventBus?.emit) eventBus.emit('dragEnd', ctx); 
      },
      notifyPanStart: ctx => { 
        if (eventBus?.emit) {
          eventBus.emit('panStart', ctx);
        }
      },
      updatePan: (ctx, evt) => {
        const currentEvent = evt || ctx.lastEvent;
        if (!currentEvent || !currentEvent.world) return;
        if (eventBus?.emit) eventBus.emit('pan', { start: ctx.start, pos: currentEvent.world });
      },
      finishPan: ctx => { 

        if (eventBus?.emit) eventBus.emit('panEnd', ctx); 
      },
    }
  });
}

export class InteractionManager {
  constructor(canvas, camera, quadtree) {
    this.canvas = canvas;
    this.camera = camera;
    this.spatialIndex = quadtree;
    this.eventBus = new EventBus();

    const machine = createInteractionMachine({ eventBus: this.eventBus });
    this.service = interpret(machine).start();

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this._destroyed = false;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    

  }
  destroy() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.service.stop();
    this._destroyed = true;
  }
  onPointerDown(e) {
    if (this._destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = this.camera.screenToWorld(mouseX, mouseY);
    let target = null;
    try {
      target = this.spatialIndex?.queryPoint?.(world) || null;
    } catch (_) { target = null; }

    this.service.send({ type: 'POINTER_DOWN', world, target, originalEvent: e });
  }
  onPointerMove(e) {
    if (this._destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = this.camera.screenToWorld(mouseX, mouseY);
    let target = null;
    try {
      target = this.spatialIndex?.queryPoint?.(world) || null;
    } catch (_) { target = null; }

    this.service.send({ type: 'POINTER_MOVE', world, target, originalEvent: e });
  }
  onPointerUp(e) {
    if (this._destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = this.camera.screenToWorld(mouseX, mouseY);
    this.service.send({ type: 'POINTER_UP', world, target: null, originalEvent: e });
  }
  on(type, cb) { this.eventBus.on(type, cb); }
  off(type, cb) { this.eventBus.off(type, cb); }
}