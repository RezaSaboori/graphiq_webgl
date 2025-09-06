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
        const d = Math.abs(event.world.x - context.startX) + Math.abs(event.world.y - context.startY);
        return d > context.dragThreshold && context.startTarget && context.startTarget.type === 'node';
      },
      shouldPan: ({ context, event }) => {
        const d = Math.abs(event.world.x - context.startX) + Math.abs(event.world.y - context.startY);
        return d > context.dragThreshold && (!context.startTarget || context.startTarget.type !== 'node');
      },
      isClick: ({ context, event }) => {
        const d = Math.abs(event.world.x - context.startX) + Math.abs(event.world.y - context.startY);
        return d <= context.dragThreshold;
      },
    },
    actions: {
      setStartEvent: assign(({ context, event }) => {
        console.log('FSM: setStartEvent', { world: event.world, target: event.target });
        return {
          ...context,
          startX: event.world.x, startY: event.world.y, startTarget: event.target
        };
      }),
      resetCursor: ({ context }) => { 
        console.log('FSM: resetCursor');
        context.eventBus?.emit('cursor', 'default'); 
      },
      setDraggingCursor: ({ context }) => { 
        console.log('FSM: setDraggingCursor');
        context.eventBus?.emit('cursor', 'grabbing'); 
      },
      setPanningCursor: ({ context }) => { 
        console.log('FSM: setPanningCursor');
        context.eventBus?.emit('cursor', 'grabbing'); 
      },
      notifyDragStart: ({ context }) => { 
        console.log('FSM: notifyDragStart', context.startTarget?.node);
        context.eventBus?.emit('dragStart', context.startTarget.node); 
      },
      handleDragging: ({ context, event }) => { 
        console.log('FSM: handleDragging', { node: context.startTarget?.node, pos: event.world });
        context.eventBus?.emit('drag', { node: context.startTarget.node, pos: event.world }); 
      },
      handleDragEnd: ({ context }) => { 
        console.log('FSM: handleDragEnd', context.startTarget?.node);
        context.eventBus?.emit('dragEnd', context.startTarget.node); 
      },
      notifyPanStart: ({ context }) => { 
        console.log('FSM: notifyPanStart', { world: { x: context.startX, y: context.startY } });
        context.eventBus?.emit('panStart', { world: { x: context.startX, y: context.startY } }); 
      },
      handlePan: ({ context, event }) => { 
        console.log('FSM: handlePan', { dx: event.world.x - context.startX, dy: event.world.y - context.startY });
        context.eventBus?.emit('pan', { dx: event.world.x - context.startX, dy: event.world.y - context.startY }); 
        context.startX = event.world.x; 
        context.startY = event.world.y; 
      },
      endPan: ({ context }) => { 
        console.log('FSM: endPan');
        context.eventBus?.emit('panEnd', null); 
      },
      emitClick: ({ context }) => { 
        console.log('FSM: emitClick', context.startTarget?.node);
        context.eventBus?.emit('click', context.startTarget?.node); 
      },
      handleHover: ({ context, event }) => { 
        console.log('FSM: handleHover', event.target?.node);
        context.eventBus?.emit('hover', event.target?.node); 
      }
    }
  });
}
