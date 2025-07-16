import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Obter detalhes de um fluxo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flowId = searchParams.get("flowId")

  if (!flowId) {
    console.error("GET /api/flow-maker: Flow ID é obrigatório")
    return NextResponse.json({ success: false, error: "Flow ID é obrigatório" }, { status: 400 })
  }

  try {
    console.log(`GET /api/flow-maker: Buscando nós para flowId: ${flowId}`)
    const { data: nodes, error: nodesError } = await supabase.from("flow_nodes").select("*").eq("flow_id", flowId)

    if (nodesError) {
      console.error("GET /api/flow-maker: Erro ao buscar nós:", nodesError)
      return NextResponse.json({ success: false, error: nodesError.message }, { status: 500 })
    }
    console.log(`GET /api/flow-maker: Nós encontrados: ${nodes.length}`)

    console.log(`GET /api/flow-maker: Buscando conexões para flowId: ${flowId}`)
    const { data: connections, error: connectionsError } = await supabase
      .from("flow_connections")
      .select("*")
      .eq("flow_id", flowId)

    if (connectionsError) {
      console.error("GET /api/flow-maker: Erro ao buscar conexões:", connectionsError)
      return NextResponse.json({ success: false, error: connectionsError.message }, { status: 500 })
    }
    console.log(`GET /api/flow-maker: Conexões encontradas: ${connections.length}`)

    console.log(`GET /api/flow-maker: Buscando configurações do canvas para flowId: ${flowId}`)
    const { data: flowData, error: flowError } = await supabase
      .from("conversation_flows")
      .select("canvas_config")
      .eq("id", flowId)
      .single()

    if (flowError) {
      console.warn(
        "GET /api/flow-maker: Erro ao buscar configurações do canvas (pode ser normal se não houver):",
        flowError.message,
      )
      // Não retornar erro 500 aqui, apenas logar e usar default
    }

    const canvasConfig = flowData?.canvas_config || { zoom: 1, pan: { x: 0, y: 0 } }
    console.log("GET /api/flow-maker: Canvas config:", canvasConfig)

    return NextResponse.json({ success: true, data: { nodes, connections, canvasConfig } })
  } catch (error) {
    console.error("GET /api/flow-maker: Erro inesperado ao obter fluxo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// POST - Salvar ou atualizar um fluxo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flowId, nodes, connections, canvasConfig } = body

    console.log("POST /api/flow-maker: Recebendo requisição para flowId:", flowId)
    console.log("POST /api/flow-maker: Nós recebidos:", nodes.length)
    console.log("POST /api/flow-maker: Conexões recebidas:", connections.length)
    console.log("POST /api/flow-maker: Canvas config recebido:", canvasConfig)

    if (!flowId) {
      console.error("POST /api/flow-maker: Flow ID é obrigatório")
      return NextResponse.json({ success: false, error: "Flow ID é obrigatório" }, { status: 400 })
    }

    // Deletar nós e conexões existentes para este flowId
    console.log(`POST /api/flow-maker: Deletando conexões existentes para flowId: ${flowId}`)
    const { error: deleteConnectionsError } = await supabase.from("flow_connections").delete().eq("flow_id", flowId)
    if (deleteConnectionsError) {
      console.error("POST /api/flow-maker: Erro ao deletar conexões existentes:", deleteConnectionsError)
      return NextResponse.json(
        { success: false, error: `Erro ao deletar conexões: ${deleteConnectionsError.message}` },
        { status: 500 },
      )
    }
    console.log("POST /api/flow-maker: Conexões existentes deletadas.")

    console.log(`POST /api/flow-maker: Deletando nós existentes para flowId: ${flowId}`)
    const { error: deleteNodesError } = await supabase.from("flow_nodes").delete().eq("flow_id", flowId)
    if (deleteNodesError) {
      console.error("POST /api/flow-maker: Erro ao deletar nós existentes:", deleteNodesError)
      return NextResponse.json(
        { success: false, error: `Erro ao deletar nós: ${deleteNodesError.message}` },
        { status: 500 },
      )
    }
    console.log("POST /api/flow-maker: Nós existentes deletados.")

    // Inserir novos nós
    const nodesToInsert = nodes.map((node: any) => ({
      flow_id: flowId,
      node_id: node.id,
      node_type: node.type,
      title: node.data.title,
      content: node.data.content,
      // As colunas position_x / position_y são INTEGER – arredondamos para evitar erro de sintaxe
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
      config: node.data.config || {}, // Salvar o objeto de configuração completo
    }))

    if (nodesToInsert.length > 0) {
      console.log("POST /api/flow-maker: Inserindo novos nós:", nodesToInsert.length)
      const { error: nodesInsertError } = await supabase.from("flow_nodes").insert(nodesToInsert)

      if (nodesInsertError) {
        console.error("POST /api/flow-maker: Erro ao inserir nós:", nodesInsertError)
        return NextResponse.json(
          { success: false, error: `Erro ao inserir nós: ${nodesInsertError.message}` },
          { status: 500 },
        )
      }
      console.log("POST /api/flow-maker: Nós inseridos com sucesso.")
    } else {
      console.log("POST /api/flow-maker: Nenhum nó para inserir.")
    }

    // Inserir novas conexões
    const connectionsToInsert = connections.map((conn: any) => ({
      flow_id: flowId,
      source_node_id: conn.source,
      target_node_id: conn.target,
      condition_value: conn.sourceHandle || null, // Usar sourceHandle como condition_value
      label: conn.label || null,
    }))

    if (connectionsToInsert.length > 0) {
      console.log("POST /api/flow-maker: Inserindo novas conexões:", connectionsToInsert.length)
      const { error: connectionsInsertError } = await supabase.from("flow_connections").insert(connectionsToInsert)

      if (connectionsInsertError) {
        console.error("POST /api/flow-maker: Erro ao inserir conexões:", connectionsInsertError)
        return NextResponse.json(
          { success: false, error: `Erro ao inserir conexões: ${connectionsInsertError.message}` },
          { status: 500 },
        )
      }
      console.log("POST /api/flow-maker: Conexões inseridas com sucesso.")
    } else {
      console.log("POST /api/flow-maker: Nenhuma conexão para inserir.")
    }

    // Salvar canvasConfig no banco de dados
    console.log(`POST /api/flow-maker: Atualizando canvas_config para flowId: ${flowId}`)
    const { error: canvasError } = await supabase
      .from("conversation_flows")
      .update({
        canvas_config: canvasConfig || { zoom: 1, pan: { x: 0, y: 0 } },
        updated_at: new Date().toISOString(),
      })
      .eq("id", flowId)

    if (canvasError) {
      console.error("POST /api/flow-maker: Erro ao salvar configurações do canvas:", canvasError)
      return NextResponse.json(
        { success: false, error: `Erro ao salvar canvas config: ${canvasError.message}` },
        { status: 500 },
      )
    }
    console.log("POST /api/flow-maker: Canvas config atualizado com sucesso.")

    return NextResponse.json({ success: true, message: "Fluxo salvo com sucesso!" })
  } catch (error) {
    console.error("POST /api/flow-maker: Erro inesperado ao salvar fluxo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
