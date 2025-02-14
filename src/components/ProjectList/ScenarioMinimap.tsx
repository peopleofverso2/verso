import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ProjectService } from '../../services/projectService';
import { Project } from '../../types/project';

interface ScenarioMinimapProps {
  projectId: string;
  height?: number;
}

const ScenarioMinimap: React.FC<ScenarioMinimapProps> = ({ 
  projectId,
  height = 140 
}) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const loadProjectFlow = async () => {
      try {
        const projectService = ProjectService.getInstance();
        const project = await projectService.loadProject(projectId);
        if (project?.nodes) {
          setNodes(project.nodes);
          setEdges(project.edges || []);
        }
      } catch (error) {
        console.error('Error loading project flow:', { projectId, error });
      }
    };

    loadProjectFlow();
  }, [projectId]);

  return (
    <div style={{ height: `${height}px`, background: '#1e1e1e' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          panOnDrag={false}
          preventScrolling={true}
          fitView
        >
          <Background />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ScenarioMinimap;
