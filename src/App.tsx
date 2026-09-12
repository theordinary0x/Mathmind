import React, { useState, useEffect, useMemo } from 'react';
import { PropositionNode, GraphDataset } from './types';
import { 
  loadDataset, 
  saveDataset, 
  exportDatasetToJson, 
  parseImportedJson, 
  computeDownstreamMap 
} from './utils/storage';
import { PEANO_DATASET } from './data/seedData';
import { Header } from './components/Header';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { CreateNodeModal } from './components/CreateNodeModal';

export const App: React.FC = () => {
  const [dataset, setDataset] = useState<GraphDataset>(() => loadDataset());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<'dagre' | 'cose'>('dagre');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save whenever dataset changes
  useEffect(() => {
    saveDataset(dataset);
  }, [dataset]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Compute downstream dependents
  const downstreamMap = useMemo(() => {
    return computeDownstreamMap(dataset.nodes);
  }, [dataset.nodes]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return dataset.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, dataset.nodes]);

  // Handle connecting two nodes (Target depends on Source)
  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      showToast('无法将命题连接到自身');
      return;
    }

    const targetNode = dataset.nodes.find(n => n.id === targetId);
    const sourceNode = dataset.nodes.find(n => n.id === sourceId);

    if (!targetNode || !sourceNode) return;

    if (targetNode.depends_on.includes(sourceId)) {
      showToast(`「${targetNode.title}」已存在对「${sourceNode.title}」的依赖`);
      return;
    }

    // Add dependency: Target depends on Source
    const updatedNodes = dataset.nodes.map(n => {
      if (n.id === targetId) {
        return {
          ...n,
          depends_on: [...n.depends_on, sourceId]
        };
      }
      return n;
    });

    setDataset({ ...dataset, nodes: updatedNodes });
    showToast(`成功建立依赖：${targetNode.title} 依赖 ${sourceNode.title}`);
  };

  // Update existing node
  const handleUpdateNode = (updatedNode: PropositionNode) => {
    const updatedNodes = dataset.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n));
    setDataset({ ...dataset, nodes: updatedNodes });
    showToast(`已保存命题：${updatedNode.title}`);
  };

  // Create new node
  const handleCreateNode = (newNode: PropositionNode) => {
    const updatedNodes = [...dataset.nodes, newNode];
    setDataset({ ...dataset, nodes: updatedNodes });
    setSelectedNodeId(newNode.id);
    showToast(`成功创建命题：${newNode.title}`);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = dataset.nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        depends_on: n.depends_on.filter(depId => depId !== nodeId)
      }));
    setDataset({ ...dataset, nodes: updatedNodes });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    showToast('已删除命题及其相关依赖连线');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const imported = parseImportedJson(content);
        setDataset(imported);
        setSelectedNodeId(null);
        showToast('知识网络导入成功！');
      } catch (err: any) {
        alert(`导入失败：${err.message || '格式错误'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Peano seed data
  const handleResetSeed = () => {
    if (window.confirm('确定要重置为初始的「皮亚诺公理推导体系」吗？当前未导出的修改将被覆盖。')) {
      setDataset(PEANO_DATASET);
      setSelectedNodeId(null);
      showToast('已重置为初始经典推导网络');
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#FAF8F5]">
      {/* Top Header */}
      <Header
        layoutType={layoutType}
        onChangeLayout={setLayoutType}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        isConnectingMode={isConnectingMode}
        onToggleConnectingMode={() => setIsConnectingMode(!isConnectingMode)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onExport={() => exportDatasetToJson(dataset)}
        onImport={handleImportJson}
        onResetSeed={handleResetSeed}
        nodeCount={dataset.nodes.length}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas
          nodes={dataset.nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          layoutType={layoutType}
          isFocusMode={isFocusMode}
          searchQuery={searchQuery}
          onConnectNodes={handleConnectNodes}
          isConnectingMode={isConnectingMode}
          setIsConnectingMode={setIsConnectingMode}
        />

        {/* Sliding Detail Drawer */}
        <NodeDetailDrawer
          node={selectedNode}
          allNodes={dataset.nodes}
          downstreamMap={downstreamMap}
          onClose={() => setSelectedNodeId(null)}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onNavigateToNode={id => setSelectedNodeId(id)}
        />
      </main>

      {/* Create Modal */}
      <CreateNodeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        allNodes={dataset.nodes}
        onCreateNode={handleCreateNode}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2C2B29] text-white text-xs px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
