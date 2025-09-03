// InteractionManager.js
import { createMachine, interpret, assign } from 'xstate';

export class EventBus {
  constructor() { this.listeners = {}; }
  on(type, cb) { (this.listeners[type] ||= []).push(cb); }
  off(type, cb) { this.listeners[type] = (this.listeners[type] || []).filter(fn => fn !== cb); }
  emit(type, ...args) { (this.listeners[type] || []).forEach(fn => fn(...args)); }
}

function createInteractionMachine(context = {}) {
  return createMachine({
    id: 'interaction',
    initial: 'idle',
    context,
    states: {
      idle: {
        on: {
          POINTER_DOWN: [
            { target: 'draggingNode', cond: 'onNode', actions: 'setStart' },
            { target: 'panning', actions: 'setStart' }
          ],
          POINTER_MOVE: [],
          POINTER_UP: [],
        },
      },
      draggingNode: {
        entry: 'notifyDragStart',
        on: {
          POINTER_MOVE: { actions: ['dragNode', 'notifyDrag'] },
          POINTER_UP: { target: 'idle', actions: ['finishDrag', 'notifyDragEnd', 'clearTemp'] }
        }
      },
      panning: {
        entry: 'notifyPanStart',
        on: {
          POINTER_MOVE: { actions: ['updatePan', 'notifyPan'] },
          POINTER_UP: { target: 'idle', actions: ['finishPan', 'notifyPanEnd', 'clearTemp'] },
        },
      }
    }
  }, {
    guards: {
      onNode: (ctx, evt) => !!evt.target?.type && evt.target.type === 'node'
    },
    actions: {
      setStart: assign((ctx, evt) => ({ ...ctx, start: evt.world, node: evt.target?.node })),
      clearTemp: assign(_ => ({ start: undefined, node: undefined })),
      notifyDragStart: ctx => ctx.eventBus.emit('dragStart', ctx),
      dragNode: (ctx, evt) => ctx.eventBus.emit('drag', { ...ctx, pos: evt.world }),
      notifyDrag: ctx => {},
      finishDrag: ctx => ctx.eventBus.emit('dragEnd', ctx),
      notifyDragEnd: ctx => {},
      notifyPanStart: ctx => ctx.eventBus.emit('panStart', ctx),
      updatePan: (ctx, evt) => ctx.eventBus.emit('pan', { ...ctx, pos: evt.world }),
      finishPan: ctx => ctx.eventBus.emit('panEnd', ctx),
      notifyPanEnd: ctx => {},
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

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }
  destroy() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.service.stop();
  }
  onPointerDown(e) {
    const world = this.camera.screenToWorld(e.offsetX, e.offsetY);
    const target = this.spatialIndex.queryPoint(world) || null;
    this.service.send({ type: 'POINTER_DOWN', world, target, originalEvent: e });
  }
  onPointerMove(e) {
    const world = this.camera.screenToWorld(e.offsetX, e.offsetY);
    const target = this.spatialIndex.queryPoint(world) || null;
    this.service.send({ type: 'POINTER_MOVE', world, target, originalEvent: e });
  }
  onPointerUp(e) {
    const world = this.camera.screenToWorld(e.offsetX, e.offsetY);
    this.service.send({ type: 'POINTER_UP', world, target: null, originalEvent: e });
  }
  on(type, cb) { this.eventBus.on(type, cb); }
  off(type, cb) { this.eventBus.off(type, cb); }
}
