// src/interaction/InteractionStateMachine.js
import { createMachine, assign, fromPromise } from 'xstate';

export function createInteractionStateMachine(context = {}) {
  return createMachine({
    id: 'nodeGraphInteraction',
    initial: 'idle',
    context: {
      eventBus: null,
      dragThreshold: 3,
      ...context
    },
    states: {
      idle: {
        entry: ['resetCursor'],
        on: {
          POINTER_DOWN: [
            { target: 'pressing', actions: ['setStartEvent'] }
          ],
          POINTER_MOVE: [{ actions: ['handleHover'] }],
        }
      },
      pressing: {
        on: {
          POINTER_MOVE: [
            { target: 'draggingNode', guard: 'shouldDragNode', actions: ['notifyDragStart'] },
            { target: 'panning', guard: 'shouldPan', actions: ['notifyPanStart'] }
          ],
          POINTER_UP: [
            { target: 'idle', guard: 'isClick', actions: ['emitClick'] },
            { target: 'idle' }
          ],
        }
      },
      draggingNode: {
        entry: ['setDraggingCursor'],
        on: {
          POINTER_MOVE: { actions: ['handleDragging'] },
          POINTER_UP: { target: 'idle', actions: ['handleDragEnd', 'resetCursor'] }
        }
      },
      panning: {
        entry: ['setPanningCursor'],
        on: {
          POINTER_MOVE: { actions: ['handlePan'] },
          POINTER_UP: { target: 'idle', actions: ['endPan', 'resetCursor'] }
        }
      }
    }
  }, {
    guards: {
      shouldDragNode: ({ context, event }) => {
        // Only drag if threshold distance is passed and node under pointer
        const d = Math.abs(event.screen.x - context.startX) + Math.abs(event.screen.y - context.startY);
        return d > context.dragThreshold && context.startTarget && context.startTarget.type === 'node';
      },
      shouldPan: ({ context, event }) => {
        const d = Math.abs(event.screen.x - context.startX) + Math.abs(event.screen.y - context.startY);
        return d > context.dragThreshold && (!context.startTarget || context.startTarget.type !== 'node');
      },
      isClick: ({ context, event }) => {
        const d = Math.abs(event.screen.x - context.startX) + Math.abs(event.screen.y - context.startY);
        return d <= context.dragThreshold;
      },
    },
    actions: {
      setStartEvent: assign(({ context, event }) => {
        return {
          ...context,
          startX: event.screen.x, startY: event.screen.y, startTarget: event.target
        };
      }),
      resetCursor: ({ context }) => { 
        context.eventBus?.emit('cursor', 'default'); 
      },
      setDraggingCursor: ({ context }) => { 
        context.eventBus?.emit('cursor', 'grabbing'); 
      },
      setPanningCursor: ({ context }) => { 
        context.eventBus?.emit('cursor', 'grabbing'); 
      },
      notifyDragStart: ({ context }) => { 
        context.eventBus?.emit('dragStart', context.startTarget.node); 
      },
      handleDragging: ({ context, event }) => { 
        context.eventBus?.emit('drag', { node: context.startTarget.node, world: event.world }); 
      },
      handleDragEnd: ({ context }) => { 
        context.eventBus?.emit('dragEnd', context.startTarget.node); 
      },
      notifyPanStart: ({ context }) => { 
        context.eventBus?.emit('panStart', { screen: { x: context.startX, y: context.startY } }); 
      },
      handlePan: ({ context, event }) => { 
        context.eventBus?.emit('pan', { dx: event.screen.x - context.startX, dy: event.screen.y - context.startY }); 
        context.startX = event.screen.x; 
        context.startY = event.screen.y; 
      },
      endPan: ({ context }) => { 
        context.eventBus?.emit('panEnd', null); 
      },
      emitClick: ({ context }) => { 
        context.eventBus?.emit('click', context.startTarget?.node); 
      },
      handleHover: ({ context, event }) => { 
        context.eventBus?.emit('hover', event.target?.node); 
      }
    }
  });
}
