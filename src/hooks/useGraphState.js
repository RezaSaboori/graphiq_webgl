// src/hooks/useGraphState.js
// Refactored: Only handles raw graph data, no interaction state
import { useState, useCallback, useMemo } from 'react';
import { loadGraphFromJSON } from '../graph/loadGraphFromJSON';

export const useGraphState = (initialData) => {
    const [graphData, setGraphData] = useState(initialData);
    const [viewMode, setViewMode] = useState('default');
    const [filters, setFilters] = useState({});

    // Memoize expensive graph processing
    const graph = useMemo(() => {
        if (!graphData) return null;
        return loadGraphFromJSON(graphData);
    }, [graphData]);

    const updateGraph = useCallback((newData) => {
        setGraphData(newData);
    }, []);

    return {
        graph,
        graphData,
        viewMode,
        filters,
        updateGraph,
        setViewMode,
        setFilters
    };
};
