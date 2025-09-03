// src/hooks/useGraphState.js
import { useState, useCallback, useMemo } from 'react';
import { loadGraphFromJSON } from '../graph/loadGraphFromJSON';

export const useGraphState = (initialData) => {
    const [graphData, setGraphData] = useState(initialData);
    const [selectedNodes, setSelectedNodes] = useState(new Set());
    const [selectedEdges, setSelectedEdges] = useState(new Set());
    const [expandedProperties, setExpandedProperties] = useState(new Set());
    const [viewMode, setViewMode] = useState('default');
    const [filters, setFilters] = useState({});

    // Memoize expensive graph processing
    const graph = useMemo(() => {
        if (!graphData) return null;
        return loadGraphFromJSON(graphData);
    }, [graphData]);

    const selectNode = useCallback((nodeId, multiSelect = false) => {
        setSelectedNodes(prev => {
        const newSet = new Set(multiSelect ? prev : []);
        if (prev.has(nodeId)) {
            newSet.delete(nodeId);
        } else {
            newSet.add(nodeId);
        }
        return newSet;
        });
    }, []);

    const selectEdge = useCallback((edgeId, multiSelect = false) => {
        setSelectedEdges(prev => {
        const newSet = new Set(multiSelect ? prev : []);
        if (prev.has(edgeId)) {
            newSet.delete(edgeId);
        } else {
            newSet.add(edgeId);
        }
        return newSet;
        });
    }, []);

    const toggleProperties = useCallback((nodeId) => {
        setExpandedProperties(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
            newSet.delete(nodeId);
        } else {
            newSet.add(nodeId);
        }
        return newSet;
        });
    }, []);

    const updateGraph = useCallback((newData) => {
        setGraphData(newData);
        // Reset selections when graph changes
        setSelectedNodes(new Set());
        setSelectedEdges(new Set());
        setExpandedProperties(new Set());
    }, []);

    return {
        graph,
        selectedNodes,
        selectedEdges,
        expandedProperties,
        viewMode,
        filters,
        updateGraph,
        selectNode,
        selectEdge,
        toggleProperties,
        setViewMode,
        setFilters
    };
};
