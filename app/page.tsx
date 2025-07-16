"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  MessageSquare,
  Settings,
  Bot,
  Webhook,
  Phone,
  Key,
  Plus,
  Link,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Edit,
  Trash2,
  Menu,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  TestTube,
  Activity,
  Users,
  Send,
  FileText,
  ImageIcon,
  Search,
  Play,
  Mail,
  Tag,
  Workflow,
  Bold,
  Italic,
  Underline,
  User,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import FlowMakerWrapper from "@/components/flow-maker"
import { cn } from "@/lib/utils"

interface WhatsAppConfig {
  id?: string
  access_token: string
  phone_number_id: string
  webhook_verify_token: string
  webhook_url: string
  business_account_id: string
  app_id: string
  app_secret: string
}

interface AutoResponse {
  id?: string
  trigger: string
  response: string
  is_active: boolean
  is_bold?: boolean // Novo campo
  is_italic?: boolean // Novo campo
  is_underline?: boolean // Novo campo
}

interface Message {
  id: string
  from_number: string
  message_text: string
  message_type: string
  timestamp: string
  is_incoming: boolean
  response_sent?: string
}

interface ConversationFlow {
  id?: string
  name: string
  trigger: string
  welcome_message: string
  flow_options?: FlowOption[]
  flow_type?: string
  is_active: boolean
}

interface FlowOption {
  id?: string
  flow_id?: string
  option_number: number
  option_text: string
  response_message: string
}

interface Contact {
  id?: string
  name: string
  phone_number: string
  email?: string
  notes?: string
  tags: string[]
  is_active: boolean
}

interface MessageTemplate {
  id?: string
  name: string
  subject?: string
  message_text: string
  image_url?: string
  link_url?: string
  link_text?: string
  is_active: boolean
}

interface Campaign {
  id?: string
  name: string
  template_id: string
  status: string
  total_contacts: number
  sent_count: number
  failed_count: number
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  message_templates?: MessageTemplate
  campaign_contacts?: any[]
}

export default function WhatsAppChatbotDashboard() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    access_token: "",
    phone_number_id: "",
    webhook_verify_token: "",
    webhook_url: "",
    business_account_id: "",
    app_id: "",
    app_secret: "",
  })

  const [autoResponses, setAutoResponses] = useState<AutoResponse[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationFlows, setConversationFlows] = useState<ConversationFlow[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [databaseReady, setDatabaseReady] = useState(false)
  const [setupScript, setSetupScript] = useState<string>("")
  const [needsSetup, setNeedsSetup] = useState(false)
  const [envStatus, setEnvStatus] = useState<any>(null)

  const [webhookLogs, setWebhookLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)

  // Estados para mostrar/ocultar tokens
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)

  // Estados para edição
  const [editingResponse, setEditingResponse] = useState<AutoResponse | null>(null)
  const [editingFlow, setEditingFlow] = useState<ConversationFlow | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false)
  const [isFlowMakerOpen, setIsFlowMakerOpen] = useState(false)
  const [selectedFlowForMaker, setSelectedFlowForMaker] = useState<string>("")

  // Estados para novos itens
  const [newResponse, setNewResponse] = useState<AutoResponse>({
    trigger: "",
    response: "",
    is_active: true,
    is_bold: false, // Novo
    is_italic: false, // Novo
    is_underline: false, // Novo
  })

  const [newFlow, setNewFlow] = useState<ConversationFlow>({
    name: "",
    trigger: "",
    welcome_message: "",
    flow_options: [],
    flow_type: "simple",
    is_active: true,
  })

  const [newContact, setNewContact] = useState<Contact>({
    name: "",
    phone_number: "",
    email: "",
    notes: "",
    tags: [],
    is_active: true,
  })

  const [newTemplate, setNewTemplate] = useState<MessageTemplate>({
    name: "",
    subject: "",
    message_text: "",
    image_url: "",
    link_url: "",
    link_text: "",
    is_active: true,
  })

  const [newCampaign, setNewCampaign] = useState<Campaign>({
    name: "",
    template_id: "",
    status: "draft",
    total_contacts: 0,
    sent_count: 0,
    failed_count: 0,
  })

  // Estados para filtros e busca
  const [contactSearch, setContactSearch] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  useEffect(() => {
    checkSystemStatus()
    loadWebhookLogs()
  }, [])

  const checkEnvironmentVariables = async () => {
    try {
      const response = await fetch("/api/check-env")
      const result = await response.json()
      setEnvStatus(result)
      return result.success
    } catch (err) {
      console.error("Error checking environment:", err)
      return false
    }
  }

  const checkSystemStatus = async () => {
    setError("")
    setSuccess("")
    setConnectionStatus("checking")

    // 1. Verificar variáveis de ambiente
    const envOk = await checkEnvironmentVariables()

    if (!envOk) {
      setConnectionStatus("disconnected")
      setError("Variáveis de ambiente do Supabase não configuradas. Veja detalhes abaixo.")
      return
    }

    // 2. Testar conectividade
    try {
      const connResponse = await fetch("/api/test-connection")
      const connResult = await connResponse.json()

      console.log("Connection result:", connResult)

      if (connResult.connected) {
        setConnectionStatus("connected")

        if (connResult.needsSetup) {
          setNeedsSetup(true)
          await setupDatabase()
        } else {
          setDatabaseReady(true)
          setNeedsSetup(false)
          setSuccess("Sistema configurado e pronto para uso!")
          await loadData()
        }
      } else {
        setConnectionStatus("disconnected")
        setError(connResult.error || "Não foi possível conectar ao Supabase")
      }
    } catch (err) {
      setConnectionStatus("disconnected")
      setError("Erro de conectividade. Verifique sua internet e configurações do Supabase.")
      console.error("Connection error:", err)
    }
  }

  const setupDatabase = async () => {
    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (result.needsSetup) {
        setNeedsSetup(true)
        setSetupScript(result.sqlScript)
        setError("Banco de dados precisa ser configurado. Veja as instruções abaixo.")
      } else if (result.success) {
        setDatabaseReady(true)
        setNeedsSetup(false)
        setSuccess("Sistema configurado e pronto para uso!")
        await loadData()
      } else {
        throw new Error(result.error || "Erro ao configurar banco")
      }
    } catch (err) {
      setError(`Erro ao configurar sistema: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    }
  }

  const loadData = async () => {
    try {
      // Carregar configuração
      const { data: configData } = await supabase.from("whatsapp_config").select("*").single()

      if (configData) {
        setConfig(configData)
      }

      // Carregar respostas automáticas
      const responsesResponse = await fetch("/api/responses")
      const responsesResult = await responsesResponse.json()
      if (responsesResult.success) {
        setAutoResponses(responsesResult.data)
      }

      // Carregar fluxos de conversa
      const flowsResponse = await fetch("/api/flows")
      const flowsResult = await flowsResponse.json()
      if (flowsResult.success) {
        setConversationFlows(flowsResult.data)
      }

      // Carregar contatos
      const contactsResponse = await fetch("/api/contacts")
      const contactsResult = await contactsResponse.json()
      if (contactsResult.success) {
        setContacts(contactsResult.data)
      }

      // Carregar templates
      const templatesResponse = await fetch("/api/templates")
      const templatesResult = await templatesResponse.json()
      if (templatesResult.success) {
        setTemplates(templatesResult.data)
      }

      // Carregar campanhas
      const campaignsResponse = await fetch("/api/campaigns")
      const campaignsResult = await campaignsResponse.json()
      if (campaignsResult.success) {
        setCampaigns(campaignsResult.data)
      }

      // Carregar mensagens
      const { data: messagesData } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20)

      if (messagesData) {
        setMessages(messagesData)
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  const loadWebhookLogs = async () => {
    setLoadingLogs(true)
    try {
      const response = await fetch("/api/webhook-logs?limit=100")
      const result = await response.json()

      if (result.success) {
        setWebhookLogs(result.data)
      } else {
        console.error("Erro ao carregar logs:", result.error)
      }
    } catch (err) {
      console.error("Erro ao carregar logs:", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess("Copiado para área de transferência!")
    } catch (err) {
      setError("Erro ao copiar")
    }
  }

  const saveConfig = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data, error } = await supabase.from("whatsapp_config").upsert(config).select().single()

      if (error) throw error

      setConfig(data)
      setSuccess("Configuração salva com sucesso!")
    } catch (err) {
      setError(`Erro ao salvar: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Funções para contatos
  const addContact = async () => {
    if (!newContact.name.trim() || !newContact.phone_number.trim()) {
      setError("Nome e telefone são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setNewContact({
        name: "",
        phone_number: "",
        email: "",
        notes: "",
        tags: [],
        is_active: true,
      })
      await loadData()
      setSuccess("Contato adicionado!")
    } catch (err) {
      setError(`Erro ao adicionar contato: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateContact = async () => {
    if (!editingContact) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingContact),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setEditingContact(null)
      setIsContactDialogOpen(false)
      await loadData()
      setSuccess("Contato atualizado com sucesso!")
    } catch (err) {
      setError(`Erro ao atualizar contato: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contato?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/contacts?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess("Contato excluído com sucesso!")
    } catch (err) {
      setError(`Erro ao excluir contato: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Funções para templates
  const addTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.message_text.trim()) {
      setError("Nome e mensagem são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setNewTemplate({
        name: "",
        subject: "",
        message_text: "",
        image_url: "",
        link_url: "",
        link_text: "",
        is_active: true,
      })
      await loadData()
      setSuccess("Template adicionado!")
    } catch (err) {
      setError(`Erro ao adicionar template: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async () => {
    if (!editingTemplate) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setEditingTemplate(null)
      setIsTemplateDialogOpen(false)
      await loadData()
      setSuccess("Template atualizado com sucesso!")
    } catch (err) {
      setError(`Erro ao atualizar template: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess("Template excluído com sucesso!")
    } catch (err) {
      setError(`Erro ao excluir template: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Funções para campanhas
  const createCampaign = async () => {
    if (!newCampaign.name.trim() || !newCampaign.template_id || selectedContacts.length === 0) {
      setError("Nome, template e contatos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCampaign,
          contact_ids: selectedContacts,
        }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setNewCampaign({
        name: "",
        template_id: "",
        status: "draft",
        total_contacts: 0,
        sent_count: 0,
        failed_count: 0,
      })
      setSelectedContacts([])
      setIsCampaignDialogOpen(false)
      await loadData()
      setSuccess("Campanha criada!")
    } catch (err) {
      setError(`Erro ao criar campanha: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    if (!confirm("Tem certeza que deseja enviar esta campanha? Esta ação não pode ser desfeita.")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess(result.message)
    } catch (err) {
      setError(`Erro ao enviar campanha: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/campaigns?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess("Campanha excluída com sucesso!")
    } catch (err) {
      setError(`Erro ao excluir campanha: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Funções auxiliares
  const addAutoResponse = async () => {
    if (!newResponse.trigger.trim() || !newResponse.response.trim()) {
      setError("Trigger e resposta são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResponse),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setNewResponse({
        trigger: "",
        response: "",
        is_active: true,
        is_bold: false,
        is_italic: false,
        is_underline: false,
      })
      await loadData()
      setSuccess("Resposta automática adicionada!")
    } catch (err) {
      setError(`Erro ao adicionar resposta: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateAutoResponse = async () => {
    if (!editingResponse) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/responses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingResponse),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setEditingResponse(null)
      setIsEditDialogOpen(false)
      await loadData()
      setSuccess("Resposta atualizada com sucesso!")
    } catch (err) {
      setError(`Erro ao atualizar resposta: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteAutoResponse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta resposta?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/responses?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess("Resposta excluída com sucesso!")
    } catch (err) {
      setError(`Erro ao excluir resposta: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const addConversationFlow = async () => {
    if (!newFlow.name.trim() || !newFlow.trigger.trim() || !newFlow.welcome_message.trim()) {
      setError("Nome, trigger e mensagem de boas-vindas são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFlow),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setNewFlow({
        name: "",
        trigger: "",
        welcome_message: "",
        flow_options: [],
        flow_type: "simple",
        is_active: true,
      })
      await loadData()
      setSuccess("Fluxo de conversa adicionado!")
    } catch (err) {
      setError(`Erro ao adicionar fluxo: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateConversationFlow = async () => {
    if (!editingFlow) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/flows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFlow),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setEditingFlow(null)
      setIsFlowDialogOpen(false)
      await loadData()
      setSuccess("Fluxo atualizado com sucesso!")
    } catch (err) {
      setError(`Erro ao atualizar fluxo: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteConversationFlow = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fluxo?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/flows?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      await loadData()
      setSuccess("Fluxo excluído com sucesso!")
    } catch (err) {
      setError(`Erro ao excluir fluxo: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const generateWebhookUrl = async (useWebhookSite = false) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/generate-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useWebhookSite }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao gerar webhook")
      }

      if (result.success && result.config) {
        setConfig(result.config)
        setSuccess(result.message || "URL do webhook gerada automaticamente!")
      } else {
        throw new Error(result.error || "Resposta inválida do servidor")
      }
    } catch (err) {
      setError(`Erro ao gerar webhook: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  const testWebhookConnection = async () => {
    if (!config.webhook_url || !config.webhook_verify_token) {
      setError("Configure a URL e o token do webhook primeiro")
      return
    }

    setTestingWebhook(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: config.webhook_url,
          verify_token: config.webhook_verify_token,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.error)
      }

      await loadWebhookLogs()
    } catch (err) {
      setError(`Erro ao testar webhook: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setTestingWebhook(false)
    }
  }

  const clearWebhookLogs = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os logs?")) return

    setLoadingLogs(true)
    try {
      const response = await fetch("/api/webhook-logs", {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        setSuccess("Logs limpos com sucesso")
        setWebhookLogs([])
      } else {
        setError("Erro ao limpar logs")
      }
    } catch (err) {
      setError("Erro ao limpar logs")
    } finally {
      setLoadingLogs(false)
    }
  }

  const addOptionToFlow = (flow: ConversationFlow, setFlow: (flow: ConversationFlow) => void) => {
    const newOption: FlowOption = {
      option_number: (flow.flow_options?.length || 0) + 1,
      option_text: "",
      response_message: "",
    }
    setFlow({
      ...flow,
      flow_options: [...(flow.flow_options || []), newOption],
    })
  }

  const updateFlowOption = (
    flow: ConversationFlow,
    setFlow: (flow: ConversationFlow) => void,
    index: number,
    field: keyof FlowOption,
    value: string | number,
  ) => {
    const updatedOptions = (flow.flow_options || []).map((option, i) =>
      i === index ? { ...option, [field]: value } : option,
    )
    setFlow({ ...flow, flow_options: updatedOptions })
  }

  const removeFlowOption = (flow: ConversationFlow, setFlow: (flow: ConversationFlow) => void, index: number) => {
    const updatedOptions = (flow.flow_options || []).filter((_, i) => i !== index)
    setFlow({ ...flow, flow_options: updatedOptions })
  }

  const getLogVariant = (eventType: string) => {
    switch (eventType) {
      case "validation_success":
      case "test_success":
      case "message_saved":
        return "default"
      case "validation_error":
      case "test_failed":
      case "webhook_error":
        return "destructive"
      case "validation_attempt":
      case "test_started":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getLogIcon = (eventType: string) => {
    switch (eventType) {
      case "validation_success":
      case "test_success":
        return "✅ "
      case "validation_error":
      case "test_failed":
      case "webhook_error":
        return "❌ "
      case "validation_attempt":
      case "test_started":
        return "🔍 "
      case "message_received":
        return "📨 "
      case "message_saved":
        return "💾 "
      default:
        return "📋 "
    }
  }

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Rascunho</Badge>
      case "scheduled":
        return <Badge variant="outline">Agendada</Badge>
      case "sending":
        return <Badge variant="default">Enviando</Badge>
      case "completed":
        return <Badge variant="default">Concluída</Badge>
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(contactSearch.toLowerCase()) || contact.phone_number.includes(contactSearch)
    return matchesSearch
  })

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    )
  }

  const selectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id!))
    }
  }

  const openFlowMaker = (flowId: string) => {
    setSelectedFlowForMaker(flowId)
    setIsFlowMakerOpen(true)
  }

  // Renderizar tela de status do sistema
  if (connectionStatus === "checking" || !databaseReady) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Database className="w-6 h-6" />
              Status do Sistema WhatsApp Chatbot
            </CardTitle>
            <CardDescription>Verificando conectividade e configuração do banco de dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status das Variáveis de Ambiente */}
            {envStatus && (
              <div className="space-y-4">
                <h3 className="font-semibold">Variáveis de Ambiente</h3>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(envStatus.status).map(([key, status]) => (
                    <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                      {status === "✓ Configurada" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-gray-600">{status}</div>
                        {envStatus.values[key] && (
                          <div className="text-xs text-gray-500 font-mono">{envStatus.values[key]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!envStatus.success && (
                  <Alert className="border-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-red-700">
                      <strong>Configure as variáveis de ambiente no Vercel:</strong>
                      <br />
                      1. Acesse o Vercel Dashboard
                      <br />
                      2. Vá para Settings → Environment Variables
                      <br />
                      3. Adicione as variáveis do Supabase
                      <br />
                      4. Faça um novo deploy
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Status de Conectividade */}
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {connectionStatus === "checking" && <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />}
              {connectionStatus === "connected" && <Wifi className="w-5 h-5 text-green-500" />}
              {connectionStatus === "disconnected" && <WifiOff className="w-5 h-5 text-red-500" />}

              <div>
                <h3 className="font-semibold">Conectividade Supabase</h3>
                <p className="text-sm text-gray-600">
                  {connectionStatus === "checking" && "Verificando conexão..."}
                  {connectionStatus === "connected" && "Conectado com sucesso"}
                  {connectionStatus === "disconnected" && "Falha na conexão"}
                </p>
              </div>
            </div>

            {/* Status do Banco */}
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {needsSetup ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : databaseReady ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              )}

              <div>
                <h3 className="font-semibold">Banco de Dados</h3>
                <p className="text-sm text-gray-600">
                  {needsSetup && "Configuração manual necessária"}
                  {databaseReady && "Configurado e pronto"}
                  {!needsSetup && !databaseReady && "Verificando configuração..."}
                </p>
              </div>
            </div>

            {/* Alertas */}
            {error && (
              <Alert className="border-red-500">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Script de Configuração Manual */}
            {needsSetup && setupScript && (
              <div className="space-y-4">
                <Alert className="border-blue-500">
                  <AlertDescription className="text-blue-700">
                    <strong>Configuração Manual Necessária:</strong>
                    <br />
                    1. Copie o script SQL abaixo
                    <br />
                    2. Acesse o Supabase Dashboard
                    <br />
                    3. Vá para SQL Editor
                    <br />
                    4. Cole e execute o script
                    <br />
                    5. Clique em "Verificar Novamente"
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Script SQL:</span>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(setupScript)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap">{setupScript}</pre>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Supabase Dashboard
                  </Button>
                  <Button onClick={checkSystemStatus} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Novamente
                  </Button>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            {connectionStatus === "disconnected" && (
              <div className="space-y-4">
                <Button onClick={checkSystemStatus} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Conectar Novamente
                </Button>

                <div className="text-center">
                  <Button variant="outline" onClick={() => window.open("https://vercel.com/dashboard", "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Configurar Variáveis no Vercel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Interface principal do dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Chatbot WhatsApp</h1>
              <p className="text-gray-600">Gerencie seu chatbot WhatsApp Business com integração Meta API</p>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Conectado</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500">
            <CheckCircle className="w-4 h-4" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Fluxos
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Respostas
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="space-y-6">
              {/* Seção de Ajuda */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <HelpCircle className="w-5 h-5" />
                    Como obter suas credenciais da Meta API
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Siga os links abaixo para configurar sua aplicação WhatsApp Business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Access Token & App Secret
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">Obtenha suas credenciais no Meta for Developers</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open("https://developers.facebook.com/apps", "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Meta for Developers
                      </Button>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number ID
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">Configure seu número no WhatsApp Business</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open("https://business.facebook.com/wa/manage/phone-numbers/", "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        WhatsApp Business
                      </Button>
                    </div>
                  </div>

                  <Alert className="border-blue-300">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-blue-800">
                      <strong>Passo a passo:</strong>
                      <br />
                      1. Acesse o Meta for Developers e crie/selecione sua aplicação
                      <br />
                      2. Vá para "WhatsApp" → "API Setup"
                      <br />
                      3. Copie o Access Token temporário (depois gere um permanente)
                      <br />
                      4. Anote o Phone Number ID do número de teste
                      <br />
                      5. Em "App Settings" → "Basic", copie App ID e App Secret
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Formulário de Configuração */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Configuração da API Meta WhatsApp
                  </CardTitle>
                  <CardDescription>Configure as credenciais da sua aplicação WhatsApp Business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="access_token">Access Token</Label>
                      <div className="relative">
                        <Input
                          id="access_token"
                          type={showAccessToken ? "text" : "password"}
                          placeholder="EAAxxxxxxxxxx..."
                          value={config.access_token || ""}
                          onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowAccessToken(!showAccessToken)}
                        >
                          {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone_number_id">Phone Number ID</Label>
                      <Input
                        id="phone_number_id"
                        placeholder="1234567890123456"
                        value={config.phone_number_id || ""}
                        onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_account_id">Business Account ID</Label>
                      <Input
                        id="business_account_id"
                        placeholder="1234567890123456"
                        value={config.business_account_id || ""}
                        onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="app_id">App ID</Label>
                      <Input
                        id="app_id"
                        placeholder="1234567890123456"
                        value={config.app_id || ""}
                        onChange={(e) => setConfig({ ...config, app_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="app_secret">App Secret</Label>
                      <div className="relative">
                        <Input
                          id="app_secret"
                          type={showAppSecret ? "text" : "password"}
                          placeholder="xxxxxxxxxxxxxxxx"
                          value={config.app_secret || ""}
                          onChange={(e) => setConfig({ ...config, app_secret: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowAppSecret(!showAppSecret)}
                        >
                          {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="webhook_verify_token">Webhook Verify Token</Label>
                      <Input
                        id="webhook_verify_token"
                        placeholder="meu_token_secreto_123"
                        value={config.webhook_verify_token || ""}
                        onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://webhook.site/your-unique-url"
                      value={config.webhook_url || ""}
                      onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                    />
                  </div>
                  <Button onClick={saveConfig} disabled={loading} className="w-full">
                    {loading ? "Salvando..." : "Salvar Configuração"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flows">
            <div className="space-y-6">
              {/* Flow Maker Dialog */}
              <Dialog open={isFlowMakerOpen} onOpenChange={setIsFlowMakerOpen}>
                <DialogContent className="max-w-7xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Flow Maker Visual</DialogTitle>
                    <DialogDescription>
                      Crie fluxos de conversa visuais arrastando e conectando componentes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1">
                    {selectedFlowForMaker && (
                      <FlowMakerWrapper
                        flowId={selectedFlowForMaker}
                        onSave={() => {
                          setIsFlowMakerOpen(false)
                          loadData()
                          setSuccess("Fluxo visual salvo com sucesso!")
                        }}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Card>
                <CardHeader>
                  <CardTitle>Criar Novo Fluxo de Conversa</CardTitle>
                  <CardDescription>Configure fluxos simples ou use o Flow Maker visual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="flow_name">Nome do Fluxo</Label>
                      <Input
                        id="flow_name"
                        placeholder="Ex: Atendimento Principal"
                        value={newFlow.name}
                        onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="flow_trigger">Palavra-chave (Trigger)</Label>
                      <Input
                        id="flow_trigger"
                        placeholder="Ex: atendimento, ajuda, suporte"
                        value={newFlow.trigger}
                        onChange={(e) => setNewFlow({ ...newFlow, trigger: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="flow_type">Tipo de Fluxo</Label>
                    <Select
                      value={newFlow.flow_type}
                      onValueChange={(value) => setNewFlow({ ...newFlow, flow_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simples (Lista de opções)</SelectItem>
                        <SelectItem value="visual">Visual (Flow Maker)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                    <Textarea
                      id="welcome_message"
                      placeholder="Ex: Olá! Como posso ajudá-lo hoje?"
                      value={newFlow.welcome_message}
                      onChange={(e) => setNewFlow({ ...newFlow, welcome_message: e.target.value })}
                    />
                  </div>

                  {newFlow.flow_type === "simple" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label>Opções do Menu</Label>
                        <Button size="sm" onClick={() => addOptionToFlow(newFlow, setNewFlow)} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Opção
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {(newFlow.flow_options || []).map((option, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Opção {option.option_number}</h4>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFlowOption(newFlow, setNewFlow, index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Texto da Opção</Label>
                                <Input
                                  placeholder="Ex: Falar com atendente"
                                  value={option.option_text}
                                  onChange={(e) =>
                                    updateFlowOption(newFlow, setNewFlow, index, "option_text", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <Label>Resposta</Label>
                                <Input
                                  placeholder="Ex: Aguarde, você será direcionado..."
                                  value={option.response_message}
                                  onChange={(e) =>
                                    updateFlowOption(newFlow, setNewFlow, index, "response_message", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={addConversationFlow} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Criando..." : "Criar Fluxo"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fluxos Configurados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversationFlows.length > 0 ? (
                      conversationFlows.map((flow) => (
                        <div key={flow.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{flow.name}</h3>
                                <Badge variant={flow.is_active ? "default" : "secondary"}>
                                  {flow.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                                <Badge variant="outline">{flow.trigger}</Badge>
                                <Badge variant={flow.flow_type === "visual" ? "default" : "secondary"}>
                                  {flow.flow_type === "visual" ? (
                                    <>
                                      <Workflow className="w-3 h-3 mr-1" />
                                      Visual
                                    </>
                                  ) : (
                                    <>
                                      <Menu className="w-3 h-3 mr-1" />
                                      Simples
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{flow.welcome_message}</p>
                              {flow.flow_type === "simple" && flow.flow_options && flow.flow_options.length > 0 && (
                                <div className="text-sm">
                                  <strong>Opções:</strong>
                                  <ul className="list-disc list-inside ml-2 mt-1">
                                    {flow.flow_options.map((option) => (
                                      <li key={option.id}>
                                        {option.option_number}. {option.option_text} → {option.response_message}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {flow.flow_type === "visual" && (
                                <Button size="sm" variant="outline" onClick={() => openFlowMaker(flow.id!)}>
                                  <Workflow className="w-4 h-4 mr-1" />
                                  Flow Maker
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFlow(flow)
                                  setIsFlowDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteConversationFlow(flow.id!)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhum fluxo configurado ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Nova Resposta Automática</CardTitle>
                  <CardDescription>Configure respostas automáticas para palavras-chave específicas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trigger">Palavra-chave (Trigger)</Label>
                      <Input
                        id="trigger"
                        placeholder="Ex: oi, olá, ajuda"
                        value={newResponse.trigger}
                        onChange={(e) => setNewResponse({ ...newResponse, trigger: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="response">Resposta</Label>
                      <Textarea
                        id="response"
                        placeholder="Ex: Olá! Como posso ajudá-lo?"
                        value={newResponse.response}
                        onChange={(e) => setNewResponse({ ...newResponse, response: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {"Use "}
                        <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{"{{user_name}}"}</code>
                        {" para personalizar a mensagem."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Formatação da Mensagem</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="new_response_bold"
                          checked={newResponse.is_bold}
                          onCheckedChange={(checked) => setNewResponse({ ...newResponse, is_bold: !!checked })}
                        />
                        <Label htmlFor="new_response_bold" className="flex items-center gap-1">
                          <Bold className="w-4 h-4" /> Negrito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="new_response_italic"
                          checked={newResponse.is_italic}
                          onCheckedChange={(checked) => setNewResponse({ ...newResponse, is_italic: !!checked })}
                        />
                        <Label htmlFor="new_response_italic" className="flex items-center gap-1">
                          <Italic className="w-4 h-4" /> Itálico
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="new_response_underline"
                          checked={newResponse.is_underline}
                          onCheckedChange={(checked) => setNewResponse({ ...newResponse, is_underline: !!checked })}
                        />
                        <Label htmlFor="new_response_underline" className="flex items-center gap-1">
                          <Underline className="w-4 h-4" /> Sublinhado
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={addAutoResponse} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Adicionando..." : "Adicionar Resposta"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Respostas Configuradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {autoResponses.length > 0 ? (
                      autoResponses.map((response) => (
                        <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{response.trigger}</Badge>
                              <Badge variant={response.is_active ? "default" : "secondary"}>
                                {response.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              {response.is_bold && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Bold className="w-3 h-3" /> Negrito
                                </Badge>
                              )}
                              {response.is_italic && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Italic className="w-3 h-3" /> Itálico
                                </Badge>
                              )}
                              {response.is_underline && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Underline className="w-3 h-3" /> Sublinhado
                                </Badge>
                              )}
                              {response.response.includes("{{user_name}}") && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <User className="w-3 h-3" /> Personalizado
                                </Badge>
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-sm text-gray-600",
                                response.is_bold && "font-bold",
                                response.is_italic && "italic",
                                response.is_underline && "underline",
                              )}
                            >
                              {response.response}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingResponse(response)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteAutoResponse(response.id!)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhuma resposta configurada ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <div className="space-y-6">
              {/* Seção de Contatos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gerenciar Contatos
                  </CardTitle>
                  <CardDescription>Adicione e gerencie contatos para campanhas de avisos paroquiais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contact_name">Nome</Label>
                      <Input
                        id="contact_name"
                        placeholder="Ex: João Silva"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Telefone</Label>
                      <Input
                        id="contact_phone"
                        placeholder="5511999999999"
                        value={newContact.phone_number}
                        onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email (opcional)</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        placeholder="joao@email.com"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact_tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="contact_tags"
                      placeholder="paroquiano, ministro, catequista"
                      value={newContact.tags.join(", ")}
                      onChange={(e) =>
                        setNewContact({
                          ...newContact,
                          tags: e.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter((tag) => tag),
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_notes">Observações</Label>
                    <Textarea
                      id="contact_notes"
                      placeholder="Observações sobre o contato..."
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={addContact} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Adicionando..." : "Adicionar Contato"}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Contatos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Contatos Cadastrados ({contacts.length})</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Buscar contatos..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedContacts.includes(contact.id!)}
                              onCheckedChange={() => toggleContactSelection(contact.id!)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{contact.name}</h3>
                                <Badge variant={contact.is_active ? "default" : "secondary"}>
                                  {contact.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{contact.phone_number}</p>
                              {contact.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {contact.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingContact(contact)
                                setIsContactDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteContact(contact.id!)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        {contactSearch ? "Nenhum contato encontrado" : "Nenhum contato cadastrado ainda"}
                      </p>
                    )}
                  </div>

                  {filteredContacts.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedContacts.length === filteredContacts.length}
                            onCheckedChange={selectAllContacts}
                          />
                          <span className="text-sm">
                            {selectedContacts.length > 0
                              ? `${selectedContacts.length} contato(s) selecionado(s)`
                              : "Selecionar todos"}
                          </span>
                        </div>
                        {selectedContacts.length > 0 && (
                          <Button size="sm" onClick={() => setIsCampaignDialogOpen(true)} className="ml-4">
                            <Send className="w-4 h-4 mr-2" />
                            Criar Campanha
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="space-y-6">
              {/* Templates de Mensagem */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Templates de Mensagem
                  </CardTitle>
                  <CardDescription>Crie templates reutilizáveis para suas campanhas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template_name">Nome do Template</Label>
                      <Input
                        id="template_name"
                        placeholder="Ex: Aviso Missa Dominical"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template_subject">Assunto (opcional)</Label>
                      <Input
                        id="template_subject"
                        placeholder="Ex: Missa Dominical"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="template_message">Mensagem</Label>
                    <Textarea
                      id="template_message"
                      placeholder="Paz e bem! 🙏&#10;&#10;Lembramos que nossa Missa Dominical será às 19h.&#10;&#10;Venha participar conosco!&#10;&#10;Paróquia São José"
                      rows={6}
                      value={newTemplate.message_text}
                      onChange={(e) => setNewTemplate({ ...newTemplate, message_text: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template_image">URL da Imagem (opcional)</Label>
                      <Input
                        id="template_image"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={newTemplate.image_url}
                        onChange={(e) => setNewTemplate({ ...newTemplate, image_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template_link">Link (opcional)</Label>
                      <Input
                        id="template_link"
                        placeholder="https://paroquia.com.br"
                        value={newTemplate.link_url}
                        onChange={(e) => setNewTemplate({ ...newTemplate, link_url: e.target.value })}
                      />
                    </div>
                  </div>

                  {newTemplate.link_url && (
                    <div>
                      <Label htmlFor="template_link_text">Texto do Link</Label>
                      <Input
                        id="template_link_text"
                        placeholder="Ex: Clique aqui para mais informações"
                        value={newTemplate.link_text}
                        onChange={(e) => setNewTemplate({ ...newTemplate, link_text: e.target.value })}
                      />
                    </div>
                  )}

                  <Button onClick={addTemplate} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Criando..." : "Criar Template"}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Templates Criados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.length > 0 ? (
                      templates.map((template) => (
                        <div key={template.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{template.name}</h3>
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                  {template.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                                {template.image_url && (
                                  <Badge variant="outline">
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    Com Imagem
                                  </Badge>
                                )}
                                {template.link_url && (
                                  <Badge variant="outline">
                                    <Link className="w-3 h-3 mr-1" />
                                    Com Link
                                  </Badge>
                                )}
                              </div>
                              {template.subject && (
                                <p className="text-sm font-medium text-gray-700 mb-1">{template.subject}</p>
                              )}
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.message_text}</p>
                              {template.link_url && (
                                <p className="text-sm text-blue-600 mt-2">
                                  {template.link_text || "Link"}: {template.link_url}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTemplate(template)
                                  setIsTemplateDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteTemplate(template.id!)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhum template criado ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Campanhas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Campanhas de Avisos
                  </CardTitle>
                  <CardDescription>Gerencie suas campanhas de mensagens em massa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.length > 0 ? (
                      campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{campaign.name}</h3>
                                {getCampaignStatusBadge(campaign.status)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Template: {campaign.message_templates?.name}</p>
                                <p>Total de contatos: {campaign.total_contacts}</p>
                                {campaign.status === "completed" && (
                                  <p>
                                    Enviadas: {campaign.sent_count} | Falharam: {campaign.failed_count}
                                  </p>
                                )}
                                {campaign.started_at && (
                                  <p>Iniciada em: {new Date(campaign.started_at).toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {campaign.status === "draft" && (
                                <Button size="sm" onClick={() => sendCampaign(campaign.id!)} disabled={loading}>
                                  <Play className="w-4 h-4 mr-1" />
                                  Enviar
                                </Button>
                              )}
                              {campaign.status === "sending" && (
                                <Button size="sm" disabled>
                                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                  Enviando...
                                </Button>
                              )}
                              {campaign.status !== "sending" && (
                                <Button size="sm" variant="destructive" onClick={() => deleteCampaign(campaign.id!)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhuma campanha criada ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-6">
              {/* Histórico de Mensagens */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Mensagens</CardTitle>
                  <CardDescription>Últimas mensagens recebidas e enviadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg border ${
                            message.is_incoming ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{message.from_number}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{message.message_text}</p>
                          {message.response_sent && (
                            <div className="text-sm text-gray-600">
                              <strong>Resposta enviada:</strong> {message.response_sent}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Nenhuma mensagem ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhook">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    Configuração do Webhook
                  </CardTitle>
                  <CardDescription>Configure e teste seu webhook automaticamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Opções de Geração de Webhook</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => generateWebhookUrl(false)}
                        disabled={loading}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Link className="w-4 h-4" />
                          <span className="font-medium">Usar URL do Projeto</span>
                        </div>
                        <span className="text-sm text-gray-600 text-left">Usa a URL do seu projeto Vercel/Next.js</span>
                      </Button>

                      <Button
                        onClick={() => generateWebhookUrl(true)}
                        disabled={loading}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ExternalLink className="w-4 h-4" />
                          <span className="font-medium">Usar Webhook.site</span>
                        </div>
                        <span className="text-sm text-gray-600 text-left">Gera URL temporária para testes</span>
                      </Button>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button onClick={testWebhookConnection} disabled={testingWebhook} variant="default">
                        <TestTube className="w-4 h-4 mr-2" />
                        {testingWebhook ? "Testando..." : "Testar Conexão"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">URLs Configuradas</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <strong>Webhook URL:</strong>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(config.webhook_url || "")}
                            disabled={!config.webhook_url}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <code className="block bg-gray-200 px-3 py-2 rounded text-sm break-all">
                          {config.webhook_url || "Não configurado"}
                        </code>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <strong>Verify Token:</strong>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(config.webhook_verify_token || "")}
                            disabled={!config.webhook_verify_token}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <code className="block bg-gray-200 px-3 py-2 rounded text-sm break-all">
                          {config.webhook_verify_token || "Não configurado"}
                        </code>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-blue-300">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-blue-800">
                      <strong>Instruções para Facebook:</strong>
                      <br />
                      1. Gere uma URL usando uma das opções acima
                      <br />
                      2. Copie a URL e o Token usando os botões de copiar
                      <br />
                      3. No Meta for Developers, vá para sua aplicação WhatsApp
                      <br />
                      4. Em "Webhook", cole a URL e configure o Verify Token
                      <br />
                      5. Ative apenas o evento "messages"
                      <br />
                      6. Use o botão "Testar Conexão" para validar antes de configurar no Facebook
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription className="text-green-800">
                      <strong>Eventos do Webhook - Configure APENAS estes:</strong>
                      <br />
                      <div className="mt-3 space-y-2">
                        <div className="bg-white p-3 rounded border">
                          <strong>✅ HABILITAR APENAS:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm mt-1">
                            <li>
                              <code className="bg-green-100 px-2 py-1 rounded">messages</code> - Para receber mensagens
                              dos usuários
                            </li>
                          </ul>
                        </div>

                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <strong className="text-red-700">❌ NÃO HABILITAR (deixe desmarcados):</strong>
                          <div className="text-sm mt-1 text-red-600">
                            Todos os outros eventos como: <code>account_alerts</code>,{" "}
                            <code>account_review_update</code>,<code>account_update</code>,{" "}
                            <code>business_capability_update</code>, <code>flows</code>,<code>message_echoes</code>,{" "}
                            <code>messaging_handovers</code>, etc.
                          </div>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <strong className="text-yellow-700">⚠️ Importante:</strong>
                          <p className="text-sm mt-1 text-yellow-700">
                            Habilitar eventos desnecessários pode causar spam de notificações e problemas no sistema.
                            Para um chatbot básico, apenas <code>messages</code> é suficiente.
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante sobre Webhook.site</h4>
                    <p className="text-sm text-yellow-700">
                      URLs do Webhook.site são temporárias e podem expirar. Use apenas para testes iniciais. Para
                      produção, sempre use a URL do seu projeto.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logs do Webhook</CardTitle>
                  <CardDescription>Histórico de requisições recebidas no webhook</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Últimos Logs</h3>
                    <Button variant="destructive" size="sm" onClick={clearWebhookLogs} disabled={loadingLogs}>
                      {loadingLogs ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Limpando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Logs
                        </>
                      )}
                    </Button>
                  </div>

                  {loadingLogs ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                      Carregando logs...
                    </div>
                  ) : webhookLogs.length > 0 ? (
                    <div className="space-y-3">
                      {webhookLogs.map((log) => (
                        <Alert key={log.id} variant={getLogVariant(log.event_type)}>
                          <div className="flex items-center gap-2">
                            {getLogIcon(log.event_type)}
                            <AlertDescription className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{log.event_type}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">{log.description}</div>
                              {log.details && (
                                <details className="mt-2">
                                  <summary className="text-blue-500 text-sm cursor-pointer">Mostrar Detalhes</summary>
                                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </AlertDescription>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nenhum log encontrado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modais de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Resposta Automática</DialogTitle>
              <DialogDescription>Atualize a palavra-chave e a resposta</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trigger" className="text-right">
                  Palavra-chave
                </Label>
                <Input
                  id="trigger"
                  value={editingResponse?.trigger || ""}
                  onChange={(e) => setEditingResponse({ ...editingResponse!, trigger: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="response" className="text-right">
                  Resposta
                </Label>
                <Textarea
                  id="response"
                  value={editingResponse?.response || ""}
                  onChange={(e) => setEditingResponse({ ...editingResponse!, response: e.target.value })}
                  className="col-span-3"
                />
                <p className="col-span-4 text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                  <Info className="w-3 h-3" />
                  {"Use "}
                  <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{"{{user_name}}"}</code>
                  {" para personalizar a mensagem."}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Ativo
                </Label>
                <Checkbox
                  id="is_active"
                  checked={editingResponse?.is_active || false}
                  onCheckedChange={(checked) => setEditingResponse({ ...editingResponse!, is_active: !!checked })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Formatação</Label>
                <div className="col-span-3 flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_response_bold"
                      checked={editingResponse?.is_bold || false}
                      onCheckedChange={(checked) => setEditingResponse({ ...editingResponse!, is_bold: !!checked })}
                    />
                    <Label htmlFor="edit_response_bold" className="flex items-center gap-1">
                      <Bold className="w-4 h-4" /> Negrito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_response_italic"
                      checked={editingResponse?.is_italic || false}
                      onCheckedChange={(checked) => setEditingResponse({ ...editingResponse!, is_italic: !!checked })}
                    />
                    <Label htmlFor="edit_response_italic" className="flex items-center gap-1">
                      <Italic className="w-4 h-4" /> Itálico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_response_underline"
                      checked={editingResponse?.is_underline || false}
                      onCheckedChange={(checked) =>
                        setEditingResponse({ ...editingResponse!, is_underline: !!checked })
                      }
                    />
                    <Label htmlFor="edit_response_underline" className="flex items-center gap-1">
                      <Underline className="w-4 h-4" /> Sublinhado
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={updateAutoResponse} disabled={loading}>
                {loading ? "Atualizando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Fluxo de Conversa</DialogTitle>
              <DialogDescription>Atualize os detalhes do fluxo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="flow_name" className="text-right">
                  Nome do Fluxo
                </Label>
                <Input
                  id="flow_name"
                  value={editingFlow?.name || ""}
                  onChange={(e) => setEditingFlow({ ...editingFlow!, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="flow_trigger" className="text-right">
                  Palavra-chave (Trigger)
                </Label>
                <Input
                  id="flow_trigger"
                  value={editingFlow?.trigger || ""}
                  onChange={(e) => setEditingFlow({ ...editingFlow!, trigger: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="welcome_message" className="text-right">
                  Mensagem de Boas-vindas
                </Label>
                <Textarea
                  id="welcome_message"
                  value={editingFlow?.welcome_message || ""}
                  onChange={(e) => setEditingFlow({ ...editingFlow!, welcome_message: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Ativo
                </Label>
                <Checkbox
                  id="is_active"
                  checked={editingFlow?.is_active || false}
                  onCheckedChange={(checked) => setEditingFlow({ ...editingFlow!, is_active: !!checked })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={updateConversationFlow} disabled={loading}>
                {loading ? "Atualizando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Contato</DialogTitle>
              <DialogDescription>Atualize os detalhes do contato</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="contact_name"
                  value={editingContact?.name || ""}
                  onChange={(e) => setEditingContact({ ...editingContact!, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="contact_phone"
                  value={editingContact?.phone_number || ""}
                  onChange={(e) => setEditingContact({ ...editingContact!, phone_number: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_email" className="text-right">
                  Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={editingContact?.email || ""}
                  onChange={(e) => setEditingContact({ ...editingContact!, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_notes" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="contact_notes"
                  value={editingContact?.notes || ""}
                  onChange={(e) => setEditingContact({ ...editingContact!, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="contact_tags"
                  value={editingContact?.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingContact({
                      ...editingContact!,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Ativo
                </Label>
                <Checkbox
                  id="is_active"
                  checked={editingContact?.is_active || false}
                  onCheckedChange={(checked) => setEditingContact({ ...editingContact!, is_active: !!checked })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={updateContact} disabled={loading}>
                {loading ? "Atualizando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Template de Mensagem</DialogTitle>
              <DialogDescription>Atualize os detalhes do template</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_name" className="text-right">
                  Nome do Template
                </Label>
                <Input
                  id="template_name"
                  value={editingTemplate?.name || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_subject" className="text-right">
                  Assunto
                </Label>
                <Input
                  id="template_subject"
                  value={editingTemplate?.subject || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, subject: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_message" className="text-right">
                  Mensagem
                </Label>
                <Textarea
                  id="template_message"
                  value={editingTemplate?.message_text || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, message_text: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_image" className="text-right">
                  URL da Imagem
                </Label>
                <Input
                  id="template_image"
                  value={editingTemplate?.image_url || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, image_url: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_link" className="text-right">
                  Link
                </Label>
                <Input
                  id="template_link"
                  value={editingTemplate?.link_url || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, link_url: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_link_text" className="text-right">
                  Texto do Link
                </Label>
                <Input
                  id="template_link_text"
                  value={editingTemplate?.link_text || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate!, link_text: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Ativo
                </Label>
                <Checkbox
                  id="is_active"
                  checked={editingTemplate?.is_active || false}
                  onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate!, is_active: !!checked })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={updateTemplate} disabled={loading}>
                {loading ? "Atualizando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Campanha</DialogTitle>
              <DialogDescription>Selecione um template e crie sua campanha</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="campaign_name" className="text-right">
                  Nome da Campanha
                </Label>
                <Input
                  id="campaign_name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_id" className="text-right">
                  Template
                </Label>
                <Select onValueChange={(value) => setNewCampaign({ ...newCampaign, template_id: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id!}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={createCampaign} disabled={loading}>
                {loading ? "Criando..." : "Criar Campanha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
