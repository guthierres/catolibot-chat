"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  type Node,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  Handle,
  Position,
  type NodeProps,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Square,
  MessageCircle,
  GitBranch,
  Zap,
  Save,
  Trash2,
  Eye,
  Bold,
  Italic,
  Underline,
  ImageIcon,
  FileText,
  Link,
  Plus,
  X,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Componentes de nós customizados
const StartNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${selected ? "border-green-500" : "border-green-300"}`}
  >
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center">
      <Play className="w-4 h-4 mr-2 text-green-600" />
      <div>
        <div className="text-sm font-bold text-green-800">{data.title}</div>
        <div className="text-xs text-green-600 max-w-48 truncate">{data.content}</div>
      </div>
    </div>
  </div>
)

const MessageNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${selected ? "border-blue-500" : "border-blue-300"}`}
  >
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center">
      <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
      <div>
        <div className="text-sm font-bold text-blue-800">{data.title}</div>
        <div className="text-xs text-blue-600 max-w-48 truncate">{data.content}</div>
        <div className="flex gap-1 mt-1">
          {data.config?.hasOptions && (
            <Badge variant="outline" className="text-xs">
              Com opções
            </Badge>
          )}
          {data.config?.formatting?.bold && (
            <Badge variant="outline" className="text-xs">
              <Bold className="w-2 h-2" />
            </Badge>
          )}
          {data.config?.formatting?.italic && (
            <Badge variant="outline" className="text-xs">
              <Italic className="w-2 h-2" />
            </Badge>
          )}
          {data.config?.formatting?.underline && (
            <Badge variant="outline" className="text-xs">
              <Underline className="w-2 h-2" />
            </Badge>
          )}
          {data.config?.media?.type && (
            <Badge variant="outline" className="text-xs">
              {data.config.media.type === "image" && <ImageIcon className="w-2 h-2" />}
              {data.config.media.type === "document" && <FileText className="w-2 h-2" />}
              {data.config.media.type === "link" && <Link className="w-2 h-2" />}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
)

const QuickRepliesMessageNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 ${selected ? "border-orange-500" : "border-orange-300"} w-64`}
  >
    <Handle type="target" position={Position.Left} />
    <div className="flex items-center mb-2">
      <MessageCircle className="w-4 h-4 mr-2 text-orange-600" />
      <div className="text-sm font-bold text-orange-800">{data.title}</div>
    </div>
    <div className="flex flex-col gap-1 text-xs text-orange-700">
      {data.config?.header && <div className="truncate">Header: {data.config.header}</div>}
      <div className="truncate">Body: {data.content}</div>
      {data.config?.footer && <div className="truncate">Footer: {data.config.footer}</div>}
      <div className="mt-2 font-semibold">Botões:</div>
      {data.config?.buttons?.map((button: any, index: number) => (
        <div key={index} className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs max-w-[calc(100%-20px)] truncate">
            {button.label}
          </Badge>
          <Handle
            type="source"
            position={Position.Right}
            id={button.value} // Use button value as sourceHandle ID
            style={{ top: `${40 + (index * 20) / (data.config.buttons.length + 1)}%`, right: -10 }} // Adjust position dynamically
          />
        </div>
      ))}
      {data.config?.elseExitLabel && (
        <div className="flex items-center justify-between mt-1">
          <Badge variant="outline" className="text-xs max-w-[calc(100%-20px)] truncate">
            {data.config.elseExitLabel}
          </Badge>
          <Handle
            type="source"
            position={Position.Right}
            id="else-exit" // Unique ID for else exit
            style={{ bottom: "10%", right: -10 }} // Fixed position for else exit
          />
        </div>
      )}
    </div>
  </div>
)

const ConditionNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${selected ? "border-yellow-500" : "border-yellow-300"}`}
  >
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center">
      <GitBranch className="w-4 h-4 mr-2 text-yellow-600" />
      <div>
        <div className="text-sm font-bold text-yellow-800">{data.title}</div>
        <div className="text-xs text-yellow-600 max-w-48 truncate">{data.content}</div>
      </div>
    </div>
  </div>
)

const ActionNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${selected ? "border-purple-500" : "border-purple-300"}`}
  >
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center">
      <Zap className="w-4 h-4 mr-2 text-purple-600" />
      <div>
        <div className="text-sm font-bold text-purple-800">{data.title}</div>
        <div className="text-xs text-purple-600 max-w-48 truncate">{data.content}</div>
      </div>
    </div>
  </div>
)

const EndNode = ({ data, selected }: NodeProps) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${selected ? "border-red-500" : "border-red-300"}`}
  >
    <Handle type="target" position={Position.Left} />
    <div className="flex items-center">
      <Square className="w-4 h-4 mr-2 text-red-600" />
      <div>
        <div className="text-sm font-bold text-red-800">{data.title}</div>
        <div className="text-xs text-red-600 max-w-48 truncate">{data.content}</div>
      </div>
    </div>
  </div>
)

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  "quick-replies-message": QuickRepliesMessageNode, // Novo tipo de nó
  condition: ConditionNode,
  action: ActionNode,
  end: EndNode,
}

interface FlowMakerProps {
  flowId: string
  onSave?: () => void
}

export function FlowMaker({ flowId, onSave }: FlowMakerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewInput, setPreviewInput] = useState("")
  const [currentPreviewNode, setCurrentPreviewNode] = useState<string>("")
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const { toast } = useToast()

  // Estados para edição de nó
  const [editingNode, setEditingNode] = useState({
    title: "",
    content: "",
    type: "message",
    config: {
      hasOptions: false,
      options: [] as string[],
      formatting: {
        bold: false,
        italic: false,
        underline: false,
      },
      media: {
        type: null as string | null,
        url: "",
        caption: "",
      },
      // Novas propriedades para Quick Replies
      header: "",
      footer: "",
      buttons: [] as { label: string; value: string }[],
      elseExitLabel: "Else exit",
    },
  })

  const nodeTypeOptions = [
    { value: "start", label: "Início", icon: Play },
    { value: "message", label: "Mensagem", icon: MessageCircle },
    { value: "quick-replies-message", label: "Mensagem de Respostas Rápidas", icon: MessageCircle }, // Novo
    { value: "condition", label: "Condição", icon: GitBranch },
    { value: "action", label: "Ação", icon: Zap },
    { value: "end", label: "Fim", icon: Square },
  ]

  const mediaTypeOptions = [
    { value: null, label: "Nenhum" },
    { value: "image", label: "Imagem" },
    { value: "document", label: "Documento" },
    { value: "link", label: "Link" },
    { value: "file", label: "Arquivo" }, // Novo
  ]

  // Carregar dados do fluxo
  useEffect(() => {
    loadFlowData()
  }, [flowId])

  const loadFlowData = async () => {
    try {
      const response = await fetch(`/api/flow-maker?flowId=${flowId}`)
      const result = await response.json()

      if (result.success) {
        const { nodes: dbNodes, connections, canvasConfig } = result.data

        // Converter nós do banco para formato ReactFlow
        const flowNodes = dbNodes.map((node: any) => ({
          id: node.node_id,
          type: node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            title: node.title,
            content: node.content,
            config: {
              hasOptions: false, // Default para compatibilidade
              options: [], // Default para compatibilidade
              formatting: { bold: false, italic: false, underline: false }, // Default
              media: { type: null, url: "", caption: "" }, // Default
              header: "", // Default para Quick Replies
              footer: "", // Default para Quick Replies
              buttons: [], // Default para Quick Replies
              elseExitLabel: "Else exit", // Default para Quick Replies
              ...node.config, // Sobrescreve com as configurações do banco
            },
          },
        }))

        // Converter conexões para edges
        const flowEdges = connections.map((conn: any, index: number) => ({
          id: `edge-${index}`,
          source: conn.source_node_id,
          target: conn.target_node_id,
          sourceHandle: conn.condition_value, // Usado para botões e else-exit
          label: conn.label,
          type: "smoothstep",
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao carregar fluxo",
          description: result.error || "Não foi possível carregar os dados do fluxo.",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar fluxo:", error)
      toast({
        variant: "destructive",
        title: "Erro de rede",
        description: "Não foi possível conectar ao servidor para carregar o fluxo.",
      })
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, type: "smoothstep" } // Default type

      // If connecting from a Quick Replies Message node, add a label to the edge
      const sourceNode = nodes.find((node) => node.id === params.source)
      if (sourceNode && sourceNode.type === "quick-replies-message") {
        const button = sourceNode.data.config?.buttons?.find((btn: any) => btn.value === params.sourceHandle)
        if (button) {
          newEdge.label = button.label
        } else if (params.sourceHandle === "else-exit") {
          newEdge.label = sourceNode.data.config?.elseExitLabel || "Else exit"
        }
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges, nodes], // Add nodes to dependency array
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setEditingNode({
      title: node.data.title,
      content: node.data.content,
      type: node.type || "message",
      config: {
        hasOptions: false, // Reset ou use valor do nó
        options: [], // Reset ou use valor do nó
        formatting: { bold: false, italic: false, underline: false }, // Reset ou use valor do nó
        media: { type: null, url: "", caption: "" }, // Reset ou use valor do nó
        header: "", // Reset ou use valor do nó
        footer: "", // Reset ou use valor do nó
        buttons: [], // Reset ou use valor do nó
        elseExitLabel: "Else exit", // Reset ou use valor do nó
        ...node.data.config, // Carrega as configurações existentes do nó
      },
    })
    setIsEditDialogOpen(true)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow")

      if (typeof type === "undefined" || !type || !reactFlowBounds) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          title: `Novo ${nodeTypeOptions.find((opt) => opt.value === type)?.label || type}`,
          content: "Clique para editar",
          config: {
            hasOptions: false,
            options: [],
            formatting: { bold: false, italic: false, underline: false },
            media: { type: null, url: "", caption: "" },
            header: "",
            footer: "",
            buttons: [],
            elseExitLabel: "Else exit",
          },
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const saveFlow = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/flow-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId,
          nodes,
          connections: edges,
          canvasConfig: reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 }, // Capturar zoom e pan reais
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Fluxo salvo!",
          description: "As alterações no fluxo foram salvas com sucesso.",
        })
        onSave?.() // Chama o callback para fechar o modal e recarregar dados no dashboard
      } else {
        console.error("Falha ao salvar fluxo:", result.error)
        toast({
          variant: "destructive",
          title: "Erro ao salvar fluxo",
          description: result.error || "Não foi possível salvar as alterações no fluxo.",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar fluxo:", error)
      toast({
        variant: "destructive",
        title: "Erro de rede",
        description: "Não foi possível conectar ao servidor para salvar o fluxo.",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateNode = () => {
    if (!selectedNode) return

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              type: editingNode.type,
              data: {
                ...node.data,
                title: editingNode.title,
                content: editingNode.content,
                config: editingNode.config,
              },
            }
          : node,
      ),
    )

    setIsEditDialogOpen(false)
    setSelectedNode(null)
  }

  const deleteNode = () => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))

    setIsEditDialogOpen(false)
    setSelectedNode(null)
  }

  const previewFlow = async () => {
    try {
      const response = await fetch("/api/flow-maker/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId,
          phoneNumber: "preview-user",
          userInput: previewInput,
          currentNodeId: currentPreviewNode,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setPreviewData(result.data)
        setCurrentPreviewNode(result.data.nextNode?.id || result.data.currentNode.id)
        setPreviewInput("")
      } else {
        console.error("Falha ao executar preview:", result.error)
        toast({
          variant: "destructive",
          title: "Erro no Preview",
          description: result.error || "Não foi possível executar o preview do fluxo.",
        })
      }
    } catch (error) {
      console.error("Erro ao executar preview:", error)
      toast({
        variant: "destructive",
        title: "Erro de rede",
        description: "Não foi possível conectar ao servidor para o preview.",
      })
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        options: [...editingNode.config.options, ""],
      },
    })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...editingNode.config.options]
    newOptions[index] = value
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        options: newOptions,
      },
    })
  }

  const removeOption = (index: number) => {
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        options: editingNode.config.options.filter((_, i) => i !== index),
      },
    })
  }

  const addQuickReplyButton = () => {
    const newButton = { label: `Botão ${editingNode.config.buttons.length + 1}`, value: `button-${Date.now()}` }
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        buttons: [...editingNode.config.buttons, newButton],
      },
    })
  }

  const updateQuickReplyButton = (index: number, label: string) => {
    const newButtons = [...editingNode.config.buttons]
    newButtons[index] = { ...newButtons[index], label: label, value: label.toLowerCase().replace(/\s/g, "-") } // Use label as value for connection
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        buttons: newButtons,
      },
    })
  }

  const removeQuickReplyButton = (index: number) => {
    setEditingNode({
      ...editingNode,
      config: {
        ...editingNode.config,
        buttons: editingNode.config.buttons.filter((_, i) => i !== index),
      },
    })
  }

  const formatMessage = (text: string, formatting: any) => {
    let formatted = text
    if (formatting.bold) formatted = `*${formatted}*`
    if (formatting.italic) formatted = `_${formatted}_`
    if (formatting.underline) formatted = `~${formatted}~`
    return formatted
  }

  const uploadToBlob = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/upload-blob`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        console.error("Erro ao fazer upload para o Blob:", response.statusText)
        toast({
          variant: "destructive",
          title: "Erro ao fazer upload",
          description: "Não foi possível enviar o arquivo para o armazenamento.",
        })
        return null
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error("Erro ao fazer upload para o Blob:", error)
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: "Ocorreu um erro ao enviar o arquivo.",
      })
      return null
    }
  }

  return (
    <div className="h-[600px] flex">
      {/* Painel lateral */}
      <div className="w-64 bg-gray-50 border-r p-4">
        <h3 className="font-semibold mb-4">Componentes</h3>
        <div className="space-y-2">
          {nodeTypeOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.value}
                className="flex items-center p-2 bg-white border rounded cursor-move hover:bg-gray-100"
                draggable
                onDragStart={(event) => onDragStart(event, option.value)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {option.label}
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-2">
          <Button onClick={saveFlow} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Fluxo"}
          </Button>
          <Button onClick={() => setIsPreviewDialogOpen(true)} variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Canvas do fluxo */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Dialog de edição de nó */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Nó</DialogTitle>
            <DialogDescription>Configure as propriedades do nó selecionado.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="formatting">Formatação</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
              {editingNode.type === "message" && <TabsTrigger value="options">Opções</TabsTrigger>}
              {editingNode.type === "quick-replies-message" && (
                <TabsTrigger value="quick-replies">Respostas Rápidas</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="node-type" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={editingNode.type}
                  onValueChange={(value) => setEditingNode({ ...editingNode, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="node-title" className="text-right">
                  Título
                </Label>
                <Input
                  id="node-title"
                  value={editingNode.title}
                  onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              {editingNode.type !== "quick-replies-message" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-content" className="text-right">
                    Conteúdo
                  </Label>
                  <Textarea
                    id="node-content"
                    value={editingNode.content}
                    onChange={(e) => setEditingNode({ ...editingNode, content: e.target.value })}
                    className="col-span-3"
                    rows={4}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="formatting" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Formatação do Texto</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bold"
                      checked={editingNode.config.formatting.bold}
                      onCheckedChange={(checked) =>
                        setEditingNode({
                          ...editingNode,
                          config: {
                            ...editingNode.config,
                            formatting: { ...editingNode.config.formatting, bold: !!checked },
                          },
                        })
                      }
                    />
                    <Label htmlFor="bold" className="flex items-center">
                      <Bold className="w-4 h-4 mr-1" />
                      Negrito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="italic"
                      checked={editingNode.config.formatting.italic}
                      onCheckedChange={(checked) =>
                        setEditingNode({
                          ...editingNode,
                          config: {
                            ...editingNode.config,
                            formatting: { ...editingNode.config.formatting, italic: !!checked },
                          },
                        })
                      }
                    />
                    <Label htmlFor="italic" className="flex items-center">
                      <Italic className="w-4 h-4 mr-1" />
                      Itálico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="underline"
                      checked={editingNode.config.formatting.underline}
                      onCheckedChange={(checked) =>
                        setEditingNode({
                          ...editingNode,
                          config: {
                            ...editingNode.config,
                            formatting: { ...editingNode.config.formatting, underline: !!checked },
                          },
                        })
                      }
                    />
                    <Label htmlFor="underline" className="flex items-center">
                      <Underline className="w-4 h-4 mr-1" />
                      Sublinhado
                    </Label>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <p className="text-sm mt-1">
                    {formatMessage(editingNode.content || "Texto de exemplo", editingNode.config.formatting)}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="media-type" className="text-right">
                    Tipo de Mídia
                  </Label>
                  <Select
                    value={editingNode.config.media.type || ""}
                    onValueChange={async (value) => {
                      if (value === "file") {
                        // Lógica para upload de arquivo
                        const fileInput = document.createElement("input")
                        fileInput.type = "file"
                        fileInput.accept = "image/*,application/pdf,video/*" // Tipos de arquivo aceitos
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setLoading(true)
                            const url = await uploadToBlob(file)
                            setLoading(false)
                            if (url) {
                              setEditingNode({
                                ...editingNode,
                                config: {
                                  ...editingNode.config,
                                  media: { type: "file", url: url, caption: "" },
                                },
                              })
                            }
                          }
                        }
                        fileInput.click()
                      } else {
                        setEditingNode({
                          ...editingNode,
                          config: {
                            ...editingNode.config,
                            media: { type: value || null, url: "", caption: "" },
                          },
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaTypeOptions.map((option) => (
                        <SelectItem key={option.value || "none"} value={option.value || ""}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingNode.config.media.type && editingNode.config.media.type !== "file" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="media-url" className="text-right">
                        URL
                      </Label>
                      <Input
                        id="media-url"
                        value={editingNode.config.media.url}
                        onChange={(e) =>
                          setEditingNode({
                            ...editingNode,
                            config: {
                              ...editingNode.config,
                              media: { ...editingNode.config.media, url: e.target.value },
                            },
                          })
                        }
                        className="col-span-3"
                        placeholder={
                          editingNode.config.media.type === "image"
                            ? "https://exemplo.com/imagem.jpg"
                            : editingNode.config.media.type === "document"
                              ? "https://exemplo.com/documento.pdf"
                              : "https://exemplo.com"
                        }
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="media-caption" className="text-right">
                        Legenda
                      </Label>
                      <Input
                        id="media-caption"
                        value={editingNode.config.media.caption}
                        onChange={(e) =>
                          setEditingNode({
                            ...editingNode,
                            config: {
                              ...editingNode.config,
                              media: { ...editingNode.config.media, caption: e.target.value },
                            },
                          })
                        }
                        className="col-span-3"
                        placeholder="Legenda opcional"
                      />
                    </div>
                  </>
                )}

                {editingNode.config.media.type === "file" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="media-url" className="text-right">
                        URL do Arquivo
                      </Label>
                      <Input id="media-url" value={editingNode.config.media.url} className="col-span-3" disabled />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="media-caption" className="text-right">
                        Legenda
                      </Label>
                      <Input
                        id="media-caption"
                        value={editingNode.config.media.caption}
                        onChange={(e) =>
                          setEditingNode({
                            ...editingNode,
                            config: {
                              ...editingNode.config,
                              media: { ...editingNode.config.media, caption: e.target.value },
                            },
                          })
                        }
                        className="col-span-3"
                        placeholder="Legenda opcional"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {editingNode.type === "message" && (
              <TabsContent value="options" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-options"
                        checked={editingNode.config.hasOptions}
                        onCheckedChange={(checked) =>
                          setEditingNode({
                            ...editingNode,
                            config: { ...editingNode.config, hasOptions: !!checked },
                          })
                        }
                      />
                      <Label htmlFor="has-options">Este nó tem opções numeradas</Label>
                    </div>
                    {editingNode.config.hasOptions && (
                      <Button size="sm" onClick={addOption}>
                        Adicionar Opção
                      </Button>
                    )}
                  </div>

                  {editingNode.config.hasOptions && (
                    <div className="space-y-2">
                      {editingNode.config.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Label className="w-8">{index + 1}.</Label>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder="Texto da opção"
                            className="flex-1"
                          />
                          <Button size="sm" variant="destructive" onClick={() => removeOption(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {editingNode.type === "quick-replies-message" && (
              <TabsContent value="quick-replies" className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="qr-header" className="text-right">
                    Cabeçalho
                  </Label>
                  <Input
                    id="qr-header"
                    value={editingNode.config.header}
                    onChange={(e) =>
                      setEditingNode({
                        ...editingNode,
                        config: { ...editingNode.config, header: e.target.value },
                      })
                    }
                    className="col-span-3"
                    placeholder="Opcional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="qr-body" className="text-right">
                    Corpo (Mensagem)
                  </Label>
                  <Textarea
                    id="qr-body"
                    value={editingNode.content}
                    onChange={(e) => setEditingNode({ ...editingNode, content: e.target.value })}
                    className="col-span-3"
                    rows={4}
                    placeholder="Mensagem principal"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="qr-footer" className="text-right">
                    Rodapé
                  </Label>
                  <Input
                    id="qr-footer"
                    value={editingNode.config.footer}
                    onChange={(e) =>
                      setEditingNode({
                        ...editingNode,
                        config: { ...editingNode.config, footer: e.target.value },
                      })
                    }
                    className="col-span-3"
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex items-center justify-between mt-6">
                  <h4 className="font-medium">Botões de Resposta Rápida</h4>
                  <Button size="sm" onClick={addQuickReplyButton}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Botão
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingNode.config.buttons.map((button, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Label className="w-16">Botão {index + 1}:</Label>
                      <Input
                        value={button.label}
                        onChange={(e) => updateQuickReplyButton(index, e.target.value)}
                        placeholder="Texto do botão"
                        className="flex-1"
                      />
                      <Button size="sm" variant="destructive" onClick={() => removeQuickReplyButton(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 items-center gap-4 mt-6">
                  <Label htmlFor="qr-else-exit" className="text-right">
                    Saída "Else"
                  </Label>
                  <Input
                    id="qr-else-exit"
                    value={editingNode.config.elseExitLabel}
                    onChange={(e) =>
                      setEditingNode({
                        ...editingNode,
                        config: { ...editingNode.config, elseExitLabel: e.target.value },
                      })
                    }
                    className="col-span-3"
                    placeholder="Texto para saída alternativa"
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <Button variant="destructive" onClick={deleteNode}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            <Button onClick={updateNode}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Preview do Fluxo</DialogTitle>
            <DialogDescription>Teste como o fluxo funcionará para os usuários.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {previewData.currentNode.title}
                    {previewData.currentNode.config?.media?.type && (
                      <Badge variant="outline">
                        {previewData.currentNode.config.media.type === "image" && <ImageIcon className="w-3 h-3" />}
                        {previewData.currentNode.config.media.type === "document" && <FileText className="w-3 h-3" />}
                        {previewData.currentNode.config.media.type === "link" && <Link className="w-3 h-3" />}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previewData.currentNode.type === "quick-replies-message" &&
                    previewData.currentNode.config?.header && (
                      <p className="text-xs text-gray-500 mb-1">{previewData.currentNode.config.header}</p>
                    )}
                  <p className="text-sm whitespace-pre-wrap">
                    {formatMessage(previewData.currentNode.content, previewData.currentNode.config?.formatting || {})}
                  </p>

                  {previewData.currentNode.config?.media?.url && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">
                        {previewData.currentNode.config.media.type === "image" && "🖼️ Imagem: "}
                        {previewData.currentNode.config.media.type === "document" && "📄 Documento: "}
                        {previewData.currentNode.config.media.type === "link" && "🔗 Link: "}
                        {previewData.currentNode.config.media.url}
                      </p>
                      {previewData.currentNode.config.media.caption && (
                        <p className="text-xs text-gray-500 mt-1">{previewData.currentNode.config.media.caption}</p>
                      )}
                    </div>
                  )}

                  {previewData.currentNode.type === "quick-replies-message" &&
                    previewData.currentNode.config?.footer && (
                      <p className="text-xs text-gray-500 mt-1">{previewData.currentNode.config.footer}</p>
                    )}

                  {previewData.availableOptions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Opções disponíveis:</p>
                      <div className="flex gap-2 flex-wrap">
                        {previewData.availableOptions.map((option: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua resposta..."
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && previewFlow()}
              />
              <Button onClick={previewFlow}>Enviar</Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsPreviewDialogOpen(false)
                setPreviewData(null)
                setPreviewInput("")
                setCurrentPreviewNode("")
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FlowMakerWrapper(props: FlowMakerProps) {
  return (
    <ReactFlowProvider>
      <FlowMaker {...props} />
    </ReactFlowProvider>
  )
}
