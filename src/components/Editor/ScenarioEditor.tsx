import React, { useState, useCallback, useEffect, useRef, DragEvent, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  NodeChange,
  EdgeChange,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from 'reactflow';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import VideoNode2 from './nodes/VideoNode2';
import MediaNode from './nodes/MediaNode';
import ChoiceEdge from './edges/ChoiceEdge';
import { ProjectService } from '../../services/projectService';
import { PovExportService } from '../../services/PovExportService';
import { Project } from '../../types/project';
import Sidebar from './controls/Sidebar';
import PovPlayer from '../Player/PovPlayer';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import 'reactflow/dist/style.css';
import debounce from 'lodash.debounce';
import { Snackbar } from '@mui/material';
import { layoutNodes } from '../../utils/layout';
import { useNavigate, useParams } from 'react-router-dom';

const nodeTypes: NodeTypes = {
  videoNode2: VideoNode2,
  mediaNode: MediaNode,
};

const edgeTypes: EdgeTypes = {
  'choice': ChoiceEdge,
  'default': ChoiceEdge,
};

function getId(): string {
  return `node-${Math.random().toString(36).substr(2, 9)}`;
}

interface ScenarioEditorProps {
  projectId?: string;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ projectId }) => {
  return (
    <ReactFlowProvider>
      <ScenarioEditorContent projectId={projectId} />
    </ReactFlowProvider>
  );
};

const ScenarioEditorContent: React.FC<ScenarioEditorProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const currentProjectId = projectId || routeProjectId;

  const handleBackToLibrary = () => {
    navigate('/');
  };

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPovPlayer, setShowPovPlayer] = useState(false);
  const [povScenario, setPovScenario] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [exporting, setExporting] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const projectService = ProjectService.getInstance();
  const povExportService = useRef(PovExportService.getInstance());

  // Gérer la fin d'une vidéo
  const onVideoEnd = useCallback((nodeId: string) => {
    if (!isPlaybackMode) return;

    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    if (outgoingEdges.length === 1) {
      // S'il n'y a qu'un seul lien sortant, passer automatiquement au nœud suivant
      const nextNodeId = outgoingEdges[0].target;
      setActiveNodeId(nextNodeId);
      setNodes(nds => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isCurrentNode: node.id === nextNodeId,
          isPlaying: node.id === nextNodeId
        }
      })));
    }
  }, [isPlaybackMode, edges, setNodes]);

  // Gérer le choix d'un bouton
  const handleChoiceSelect = useCallback((nodeId: string, choice: any) => {
    if (!isPlaybackMode) return;

    const outgoingEdges = edges.filter(edge => 
      edge.source === nodeId && edge.sourceHandle === `button-handle-${choice.id}`
    );

    if (outgoingEdges.length === 1) {
      const nextNodeId = outgoingEdges[0].target;
      setActiveNodeId(nextNodeId);
      setNodes(nds => nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isCurrentNode: node.id === nextNodeId,
          isPlaying: node.id === nextNodeId
        }
      })));
    }
  }, [isPlaybackMode, edges, setNodes]);

  const getConnectedNodeId = useCallback((nodeId: string, buttonId: string) => {
    const edge = edges.find(e => 
      e.source === nodeId && 
      e.sourceHandle === `button-handle-${buttonId}`
    );
    return edge ? edge.target : null;
  }, [edges]);

  const handleNodeDataChange = useCallback((nodeId: string, newData: any) => {
    // Si on a un nextNodeId en mode lecture, activer le nœud suivant
    if (newData.nextNodeId && isPlaybackMode) {
      setActiveNodeId(newData.nextNodeId);
      return;
    }

    // Mise à jour normale des données du nœud
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
              onDataChange: handleNodeDataChange,
              onVideoEnd,
              onChoiceSelect: handleChoiceSelect,
              getConnectedNodeId: (buttonId: string) => getConnectedNodeId(nodeId, buttonId),
            },
          };
        }
        return node;
      })
    );
  }, [isPlaybackMode, getConnectedNodeId, onVideoEnd, handleChoiceSelect]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    console.log('onConnect called with:', connection);
    
    if (!connection.source || !connection.target) {
      console.error('Missing source or target in connection:', connection);
      return;
    }

    if (connection.source === connection.target) {
      console.error('Cannot connect node to itself:', connection);
      return;
    }

    const sourceNode = nodes.find(n => n.id === connection.source);
    if (!sourceNode) {
      console.error('Source node not found:', connection.source);
      return;
    }
    
    console.log('Source node:', sourceNode);
    const sourceHandle = connection.sourceHandle;
    console.log('Source handle:', sourceHandle);
    
    let choiceId = null;
    let choiceText = '';

    // Si c'est une connexion depuis un bouton
    if (sourceHandle?.startsWith('button-handle-')) {
      choiceId = sourceHandle.replace('button-handle-', '');
      const choice = sourceNode.data.content?.choices?.find((c: any) => c.id === choiceId);
      if (!choice) {
        console.error('Choice not found in source node:', choiceId);
        return;
      }
      choiceText = choice.text;
    }

    // Check if this connection already exists
    const existingEdge = edges.find(e => 
      e.source === connection.source && 
      (sourceHandle ? e.sourceHandle === sourceHandle : e.sourceHandle === 'default-handle')
    );

    if (existingEdge) {
      console.log('Removing existing edge:', existingEdge);
      setEdges(eds => eds.filter(e => e.id !== existingEdge.id));
    }

    // Create the new edge
    const edge: Edge = {
      ...connection,
      id: choiceId 
        ? `choice-${connection.source}-${connection.target}-${choiceId}`
        : `edge-${connection.source}-${connection.target}`,
      type: choiceId ? 'choice' : 'default',
      sourceHandle: sourceHandle || 'default-handle',
      targetHandle: connection.targetHandle || 'default-handle',
      data: choiceId ? {
        choiceId,
        text: choiceText
      } : undefined,
      style: { 
        strokeWidth: 2,
        stroke: '#1976d2'
      }
    };
    console.log('Created edge:', edge);

    // Update source node choices if it's a choice connection
    if (choiceId) {
      setNodes(nds => {
        return nds.map(node => {
          if (node.id === connection.source) {
            console.log('Updating node:', node);
            const updatedChoices = (node.data.content?.choices || []).map((c: any) => {
              if (c.id === choiceId) {
                return {
                  ...c,
                  nextStepId: connection.target
                };
              }
              return c;
            });
            
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                content: {
                  ...node.data.content,
                  choices: updatedChoices
                }
              }
            };
            console.log('Updated node:', updatedNode);
            return updatedNode;
          }
          return node;
        });
      });
    }

    console.log('Adding edge:', edge);
    setEdges(eds => [...eds, edge]);
  }, [nodes, edges]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    // Mettre à jour les choix des nœuds source quand un lien est supprimé
    edgesToDelete.forEach(edge => {
      if (edge.data?.choiceId) {
        setNodes(nds => nds.map(node => {
          if (node.id === edge.source) {
            const updatedChoices = (node.data.content?.choices || []).map((choice: any) => {
              if (choice.id === edge.data.choiceId) {
                return {
                  ...choice,
                  nextStepId: undefined
                };
              }
              return choice;
            });
            
            return {
              ...node,
              data: {
                ...node.data,
                content: {
                  ...node.data.content,
                  choices: updatedChoices
                }
              }
            };
          }
          return node;
        }));
      }
    });

    setEdges(eds => eds.filter(e => !edgesToDelete.includes(e)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentProjectId || !project) return;

    setIsSaving(true);
    try {
      console.log('Saving project:', currentProjectId);
      
      // Vérifier que tous les médias sont bien sauvegardés
      const mediaLibrary = await MediaLibraryService.getInstance();
      for (const node of nodes) {
        if (node.type === 'videoNode2' && node.data.mediaId) {
          const exists = await mediaLibrary.checkMediaExists(node.data.mediaId);
          if (!exists) {
            throw new Error(`Media ${node.data.mediaId} not found. Please re-upload the video.`);
          }
        }
      }
      
      // Créer une copie propre des nœuds sans les callbacks
      const cleanNodes = nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onDataChange: undefined,
          onVideoEnd: undefined,
          onChoiceSelect: undefined,
          getConnectedNodeId: undefined,
          isPlaybackMode: undefined,
          isCurrentNode: undefined,
          isPlaying: undefined
        }
      }));

      // Mettre à jour le projet avec les derniers changements
      const updatedProject = {
        ...project,
        nodes: cleanNodes,
        edges,
        updatedAt: new Date().toISOString()
      };

      console.log('Saving updated project:', updatedProject);
      await projectService.saveProject(updatedProject);
      setProject(updatedProject);
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Error saving project:', error);
      // Afficher l'erreur à l'utilisateur
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error saving project',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, project, nodes, edges, projectService]);

  // Démarrer la lecture
  const startPlayback = useCallback(async () => {
    try {
      if (!project) return;

      // Exporter le scénario au format POV avec un titre par défaut si non défini
      const scenarioTitle = project.scenario?.scenarioTitle || 'Untitled Scenario';
      const scenario = await povExportService.current.exportScenario(
        scenarioTitle,
        nodes,
        edges
      );

      // Ouvrir le lecteur POV
      setPovScenario(scenario);
      setShowPovPlayer(true);
    } catch (error) {
      console.error('Error starting playback:', error);
      setSnackbar({
        open: true,
        message: 'Error starting playback',
        severity: 'error'
      });
    }
  }, [project, nodes, edges]);

  // Arrêter la lecture
  const stopPlayback = useCallback(() => {
    setShowPovPlayer(false);
    setPovScenario(null);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { 
          label: type === 'mediaNode' ? 'Media Node' : `${type} node`,
          onDataChange: handleNodeDataChange,
          onVideoEnd,
          onChoiceSelect: handleChoiceSelect,
          mediaId: undefined,
          content: {
            choices: [],
            timer: {
              duration: 0,
              autoTransition: false,
              loop: false
            }
          },
          isPlaybackMode: false,
          isCurrentNode: false,
          isPlaying: false,
          getConnectedNodeId: (buttonId: string) => getConnectedNodeId(nodeId, buttonId),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, handleNodeDataChange, getConnectedNodeId]
  );

  const handlePlayScenario = useCallback(async () => {
    try {
      if (!project) return;

      // Exporter le scénario au format POV
      const scenario = await povExportService.current.exportScenario(
        project.scenario.scenarioTitle,
        nodes,
        edges
      );

      // Sauvegarder le scénario et ouvrir le lecteur
      setPovScenario(scenario);
      setShowPovPlayer(true);
    } catch (error) {
      console.error('Error exporting scenario:', error);
    }
  }, [project, nodes, edges]);

  const handleExportPov = useCallback(async () => {
    try {
      setExporting(true);
      const projectService = await ProjectService.getInstance();
      const project = await projectService.getProject(currentProjectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const povService = new PovExportService();
      const blob = await povService.exportToPovFile(project);
      
      // Créer le nom du fichier avec le titre du projet
      const title = project.scenario?.scenarioTitle || 'sans-titre';
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const date = new Date().toISOString().split('T')[0];
      const filename = `${safeTitle}_${date}.pov`;

      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExporting(false);
      setSnackbar({
        open: true,
        message: 'Export POV réussi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting POV:', error);
      setExporting(false);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'export POV',
        severity: 'error'
      });
    }
  }, [currentProjectId]);

  const handleImportPov = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSnackbar({
        open: true,
        message: 'Import en cours...',
        severity: 'info'
      });

      const povService = PovExportService.getInstance();
      const { nodes: importedNodes, edges: importedEdges } = await povService.importFromPovFile(file);
      
      // Optimiser le placement des nœuds
      const nodesWithLayout = layoutNodes(importedNodes, importedEdges);
      
      setNodes(nodesWithLayout);
      setEdges(importedEdges);

      setSnackbar({
        open: true,
        message: 'Scénario importé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error importing POV:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'import du scénario',
        severity: 'error'
      });
    }

    // Reset input
    event.target.value = '';
  }, [setNodes, setEdges]);

  // Charger le projet au démarrage
  useEffect(() => {
    let isSubscribed = true;

    const loadProject = async () => {
      if (!currentProjectId) return;
      
      try {
        console.log('Loading project:', currentProjectId);
        const loadedProject = await projectService.loadProject(currentProjectId);
        if (loadedProject && isSubscribed) {
          console.log('Project loaded:', loadedProject);
          setProject(loadedProject);
          
          // Mise à jour des nœuds avec les callbacks
          const nodesWithCallbacks = loadedProject.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onDataChange: handleNodeDataChange,
              onVideoEnd,
              onChoiceSelect: handleChoiceSelect,
              getConnectedNodeId: (buttonId: string) => getConnectedNodeId(node.id, buttonId),
            },
          }));
          
          setNodes(nodesWithCallbacks);
          setEdges(loadedProject.edges);
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
    return () => {
      isSubscribed = false;
    };
  }, [currentProjectId]); // Ne dépend que de projectId

  // Sauvegarder lors des changements de nœuds ou d'arêtes
  useEffect(() => {
    if (!project) return;
    
    const saveTimeout = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [nodes, edges, handleSave, project]);

  // Mettre à jour les nœuds avec les callbacks quand le mode lecture change
  useEffect(() => {
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDataChange: handleNodeDataChange,
        onVideoEnd,
        onChoiceSelect: handleChoiceSelect,
        getConnectedNodeId: (buttonId: string) => getConnectedNodeId(node.id, buttonId),
        isPlaybackMode,
        isCurrentNode: node.id === activeNodeId,
        isPlaying: isPlaybackMode && node.id === activeNodeId
      }
    })));
  }, [isPlaybackMode, activeNodeId, handleNodeDataChange, onVideoEnd, getConnectedNodeId, handleChoiceSelect]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            minZoom={0.05}
            maxZoom={8}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <Sidebar
          onSave={handleSave}
          isSaving={isSaving}
          onBackToLibrary={handleBackToLibrary}
          isPlaybackMode={isPlaybackMode}
          onStartPlayback={startPlayback}
          onStopPlayback={stopPlayback}
        >
          <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
            {/* Boutons Export/Import POV */}
            <Tooltip title="Export POV">
              <IconButton
                onClick={handleExportPov}
                size="small"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Import POV">
              <IconButton
                component="label"
                size="small"
              >
                <UploadFileIcon />
                <input
                  type="file"
                  accept=".pov"
                  hidden
                  onChange={handleImportPov}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Sidebar>

        {/* Lecteur POV */}
        {showPovPlayer && povScenario && (
          <PovPlayer
            scenario={povScenario}
            onClose={() => setShowPovPlayer(false)}
          />
        )}
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })}
        />
      </Box>
    </Box>
  );
};
