import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST - Executar fluxo visual (para preview)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flowId, phoneNumber, userInput, currentNodeId } = body

    if (!flowId) {
      return NextResponse.json({ success: false, error: "Flow ID é obrigatório" }, { status: 400 })
    }

    // Se não há nó atual, começar pelo nó inicial
    let nodeId = currentNodeId
    if (!nodeId) {
      const { data: startNode } = await supabase
        .from("flow_nodes")
        .select("node_id")
        .eq("flow_id", flowId)
        .eq("node_type", "start")
        .single()

      nodeId = startNode?.node_id
    }

    if (!nodeId) {
      return NextResponse.json({ success: false, error: "Nó inicial não encontrado" }, { status: 400 })
    }

    // Buscar nó atual
    const { data: currentNode, error: nodeError } = await supabase
      .from("flow_nodes")
      .select("*")
      .eq("flow_id", flowId)
      .eq("node_id", nodeId)
      .single()

    if (nodeError || !currentNode) {
      return NextResponse.json({ success: false, error: "Nó não encontrado" }, { status: 400 })
    }

    // Buscar próximas opções disponíveis
    const { data: availableConnections } = await supabase
      .from("flow_connections")
      .select("*")
      .eq("flow_id", flowId)
      .eq("source_node_id", nodeId)

    let nextNode = null
    let nextNodeId: string | null = null

    if (userInput && availableConnections && availableConnections.length > 0) {
      if (currentNode.node_type === "message" && currentNode.config?.hasOptions) {
        // Lógica para nós de mensagem com opções numeradas
        const matchingOption = availableConnections.find((option) => option.condition_value === userInput.trim())
        if (matchingOption) {
          nextNodeId = matchingOption.target_node_id
        }
      } else if (currentNode.node_type === "quick-replies-message" && currentNode.config?.buttons) {
        // Lógica para nós de respostas rápidas
        const matchingButton = currentNode.config.buttons.find(
          (button: any) => button.label.toLowerCase() === userInput.trim().toLowerCase(),
        )
        if (matchingButton) {
          // Encontra a conexão cujo sourceHandle corresponde ao valor do botão
          const connectionForButton = availableConnections.find(
            (conn) => conn.source_node_id === nodeId && conn.condition_value === matchingButton.value,
          )
          if (connectionForButton) {
            nextNodeId = connectionForButton.target_node_id
          }
        } else {
          // Se não houver correspondência, tenta a saída "else-exit"
          const elseExitConnection = availableConnections.find(
            (conn) => conn.source_node_id === nodeId && conn.condition_value === "else-exit",
          )
          if (elseExitConnection) {
            nextNodeId = elseExitConnection.target_node_id
          }
        }
      } else {
        // Lógica padrão para outros tipos de nós ou sem opções
        // Por enquanto, apenas pega a primeira conexão se houver input
        const defaultConnection = availableConnections[0]
        if (defaultConnection) {
          nextNodeId = defaultConnection.target_node_id
        }
      }
    } else if (!userInput && currentNode.node_type === "start") {
      // Se não há input e é o nó inicial, avança para o próximo nó conectado
      const startConnection = availableConnections.find((conn) => conn.source_node_id === nodeId)
      if (startConnection) {
        nextNodeId = startConnection.target_node_id
      }
    }

    if (nextNodeId) {
      const { data: nextNodeData } = await supabase
        .from("flow_nodes")
        .select("*")
        .eq("flow_id", flowId)
        .eq("node_id", nextNodeId)
        .single()
      nextNode = nextNodeData
    }

    // Formatar opções disponíveis para o preview
    let formattedAvailableOptions: { label: string; value: string }[] = []
    if (currentNode.node_type === "message" && currentNode.config?.hasOptions) {
      formattedAvailableOptions = availableConnections.map((opt) => ({
        label: opt.label || opt.condition_value,
        value: opt.condition_value,
      }))
    } else if (currentNode.node_type === "quick-replies-message" && currentNode.config?.buttons) {
      formattedAvailableOptions = currentNode.config.buttons.map((btn: any) => ({
        label: btn.label,
        value: btn.value,
      }))
      const elseExitConn = availableConnections.find((conn) => conn.condition_value === "else-exit")
      if (elseExitConn) {
        formattedAvailableOptions.push({ label: currentNode.config.elseExitLabel || "Else exit", value: "else-exit" })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentNode: {
          id: currentNode.node_id,
          type: currentNode.node_type,
          title: currentNode.title,
          content: currentNode.content,
          config: currentNode.config,
        },
        nextNode: nextNode
          ? {
              id: nextNode.node_id,
              type: nextNode.node_type,
              title: nextNode.title,
              content: nextNode.content,
              config: nextNode.config,
            }
          : null,
        availableOptions: formattedAvailableOptions,
        canContinue: !!nextNode,
      },
    })
  } catch (error) {
    console.error("Erro ao executar fluxo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
