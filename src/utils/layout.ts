import { Node, Edge } from 'reactflow';

interface NodeWithLevel {
  node: Node;
  level: number;
  index: number;
}

export function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  // Trouver le nœud racine (celui qui n'a pas d'arêtes entrantes)
  const hasIncomingEdges = new Set(edges.map(e => e.target));
  const rootNode = nodes.find(node => !hasIncomingEdges.has(node.id));
  if (!rootNode) return nodes;

  // Map pour stocker les nœuds avec leur niveau et index
  const nodesWithLevels: Map<string, NodeWithLevel> = new Map();
  
  // Fonction récursive pour assigner les niveaux
  function assignLevels(nodeId: string, level: number, visited: Set<string>) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Compter combien de nœuds sont déjà à ce niveau
    const nodesAtLevel = Array.from(nodesWithLevels.values())
      .filter(n => n.level === level).length;

    nodesWithLevels.set(nodeId, {
      node,
      level,
      index: nodesAtLevel
    });

    // Traiter les nœuds enfants
    const childEdges = edges.filter(e => e.source === nodeId);
    childEdges.forEach(edge => {
      assignLevels(edge.target, level + 1, visited);
    });
  }

  // Commencer l'assignation des niveaux depuis la racine
  assignLevels(rootNode.id, 0, new Set());

  // Paramètres de mise en page
  const LEVEL_HEIGHT = 200;  // Espacement vertical entre les niveaux
  const NODE_WIDTH = 250;    // Largeur estimée d'un nœud
  const HORIZONTAL_SPACING = 50;  // Espacement horizontal minimum entre les nœuds

  // Calculer la largeur maximale nécessaire pour chaque niveau
  const levelWidths = new Map<number, number>();
  nodesWithLevels.forEach(({ level }) => {
    const nodesAtLevel = Array.from(nodesWithLevels.values())
      .filter(n => n.level === level).length;
    levelWidths.set(level, nodesAtLevel * (NODE_WIDTH + HORIZONTAL_SPACING));
  });

  // Positionner les nœuds
  return nodes.map(node => {
    const nodeInfo = nodesWithLevels.get(node.id);
    if (!nodeInfo) return node;

    const levelWidth = levelWidths.get(nodeInfo.level) || 0;
    const startX = -levelWidth / 2;
    const x = startX + (nodeInfo.index * (NODE_WIDTH + HORIZONTAL_SPACING));
    const y = nodeInfo.level * LEVEL_HEIGHT;

    return {
      ...node,
      position: { x, y }
    };
  });
}
