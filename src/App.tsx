import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowUpRight, CheckCircle2, Download, FileText, FolderOpen, Share2, Shield, Sparkles, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  uploadAPK,
  startAnalysis as startAnalysisAPI,
  getAnalysisStatus,
  checkHealth,
  type AnalysisStatus as AnalysisStatusType,
} from '@/lib/api'

type WorkflowStep = 'idle' | 'processing' | 'summary'
type AnalysisOption = {
  id: string
  name: string
  description: string
  highlight?: string
}

const analysisOptions: AnalysisOption[] = [
  {
    id: 'jadx',
    name: 'JADX',
    description: 'Decompile APK to Java/Kotlin source code for static analysis.',
    highlight: 'Recommended',
  },
  {
    id: 'apktool',
    name: 'APKTool',
    description: 'Decode APK resources, manifest, and Smali code structure.',
  },
  {
    id: 'quark',
    name: 'Quark Engine',
    description: 'Malware detection and threat scoring based on behavior patterns.',
  },
  {
    id: 'androguard',
    name: 'AndroGuard',
    description: 'Deep bytecode analysis, certificate validation, and manifest inspection.',
  },
  {
    id: 'frida',
    name: 'Frida',
    description: 'Runtime instrumentation & hook-based inspection (requires device).',
  },
  {
    id: 'mitmproxy',
    name: 'MITMProxy',
    description: 'Network traffic analysis and communication pattern discovery.',
  },
] as const


function App() {
  const [file, setFile] = useState<File | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['jadx'])
  const [step, setStep] = useState<WorkflowStep>('idle')
  const [progress, setProgress] = useState(0)
  const [apkId, setApkId] = useState<string | null>(null)
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatusType | null>(null)
  const [apiConnected, setApiConnected] = useState<boolean>(false)
  const consecutiveHealthFailures = useRef(0)

  const analysisReady = Boolean(file && selectedOptions.length)

  // Check API health on mount and periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await checkHealth()
        setApiConnected(true)
        consecutiveHealthFailures.current = 0
      } catch (error) {
        consecutiveHealthFailures.current += 1
        if (consecutiveHealthFailures.current >= 2) {
          setApiConnected(false)
        }
        // Only log unexpected errors, not timeouts (which are expected when backend is offline)
        if (error instanceof Error && !error.message.includes('timeout') && !error.message.includes('not reachable')) {
          console.warn('Backend connection check failed:', error)
        }
      }
    }

    checkConnection()
    // Recheck every 10 seconds
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [])

  // Poll analysis status when processing
  useEffect(() => {
    if (step !== 'processing' || !apkId) return

    const pollStatus = async () => {
      try {
        const status = await getAnalysisStatus(apkId)
        setAnalysisStatus(status)
        setProgress(status.progress)
        setCurrentTool(status.current_tool || null)

        if (status.status === 'completed') {
          setStep('summary')
        } else if (status.status === 'failed') {
          alert(`Analysis failed: ${status.error || 'Unknown error'}`)
          setStep('idle')
        }
      } catch (error) {
        console.error('Failed to poll status:', error)
      }
    }

    const interval = setInterval(pollStatus, 2000)
    pollStatus() // Initial poll

    return () => clearInterval(interval)
  }, [step, apkId])

  const summaryData = useMemo(() => {
    if (!analysisStatus?.results) {
      return null
    }

    // Transform backend results into summary format
    const results = analysisStatus.results
    const findings: string[] = []
    const vulnerabilities: any[] = []
    const remediation: any[] = []

    // Extract findings from tool results
    if (results.quark?.threats && Array.isArray(results.quark.threats)) {
      for (const threat of results.quark.threats) {
        findings.push(threat.description || 'Threat detected by Quark Engine')
        vulnerabilities.push({
          category: 'Malware Pattern',
          name: threat.rule || 'Suspicious behavior',
          severity: results.quark.score > 70 ? 'high' : 'medium',
          scanner: 'Quark Engine',
        })
      }
    }

    if (results.androguard && !results.androguard.error) {
      findings.push('AndroGuard analysis completed - check manifest and permissions')
    }

    if (results.jadx && !results.jadx.error) {
      findings.push('JADX decompilation successful - source code available for review')
    }

    if (results.apktool && !results.apktool.error) {
      findings.push('APKTool decoding completed - resources and manifest extracted')
    }

    // Extract errors as vulnerabilities
    for (const [tool, result] of Object.entries(results)) {
      if (result && typeof result === 'object' && 'error' in result) {
        vulnerabilities.push({
          category: 'Tool Error',
          name: `${tool}: ${result.error}`,
          severity: 'medium',
          scanner: tool,
        })
      }
    }

    return {
      generatedAt: new Date().toLocaleString(),
      keyFindings: findings,
      vulnerabilities: vulnerabilities,
      remediation: remediation,
      metrics: {
        duration: 'Calculating...',
        severityScore: results.quark?.score || 0,
        coverage: `${selectedOptions.length * 15}%`,
        riskLevel: results.quark?.score > 70 ? 'High' : results.quark?.score > 40 ? 'Medium' : 'Low',
      },
    }
  }, [analysisStatus, selectedOptions])

  type ToolActivityEntry = {
    tool: string
    status: 'completed' | 'failed' | 'pending' | 'unknown'
    error?: string
    details: string[]
    threats: { id: string; text: string }[]
    suggestions: string[]
  }

  const toolActivity = useMemo<ToolActivityEntry[]>(() => {
    if (!analysisStatus?.results) return []

    return Object.entries(analysisStatus.results).map(([tool, rawResult]) => {
      const result = rawResult || {}
      const status: 'completed' | 'failed' | 'pending' | 'unknown' = result.error
        ? 'failed'
        : result.status === 'pending'
          ? 'pending'
          : result.status === 'success'
            ? 'completed'
            : 'unknown'

      const details: string[] = []
      const suggestions: string[] = []
      const prettyToolName = tool.charAt(0).toUpperCase() + tool.slice(1)

      if (result.message) {
        details.push(result.message)
      }

      if (tool === 'jadx' && result.output_dir) {
        details.push(`Decompiled sources saved to ${result.output_dir}`)
        if (!result.error) {
          suggestions.push('Review decompiled source for secrets, credentials, and insecure flows.')
        }
      }

      if (tool === 'apktool' && typeof result.manifest_exists === 'boolean') {
        details.push(`Manifest extracted: ${result.manifest_exists ? 'yes' : 'no'}`)
        if (result.output_dir) {
          details.push(`Resources available under ${result.output_dir}`)
          if (!result.error) {
            suggestions.push('Inspect AndroidManifest.xml for exported components and over-privileged permissions.')
          }
        }
      }

      if (tool === 'quark') {
        if (typeof result.score === 'number') {
          details.push(`Threat score: ${result.score}`)
          if (result.score > 0) {
            suggestions.push('Prioritize Quark-detected malicious behaviors with high threat scores.')
          } else {
            suggestions.push('No Quark threats reported; perform manual logic validation to confirm.')
          }
        } else {
          suggestions.push('Sync Quark rules (quark --setup) to enable scoring and threat matches.')
        }
      }

      if (tool === 'androguard' && result.output) {
        const snippet = String(result.output).slice(0, 400)
        details.push(snippet.length === result.output.length ? snippet : `${snippet}…`)
        if (!result.error) {
          suggestions.push('Review AndroGuard output for suspicious certificates, permissions, and API calls.')
        }
      }

      const threats: { id: string; text: string }[] =
        tool === 'quark' && Array.isArray(result.threats)
          ? result.threats.map((threat: any, idx: number) => ({
              id: `${tool}-threat-${idx}`,
              text: threat.description || threat.rule || 'Threat detected',
            }))
          : []
      if (threats.length > 0) {
        threats.forEach((threat) => {
          suggestions.push(`Mitigate: ${threat.text}`)
        })
      }

      if (result.error) {
        suggestions.push(`Resolve ${prettyToolName} error: ${result.error}`)
      } else if (result.status === 'pending') {
        suggestions.push(`${prettyToolName} requires manual setup or live environment to run automatically.`)
      }

      return {
        tool,
        status,
        error: result.error as string | undefined,
        details,
        threats,
        suggestions,
      }
    })
  }, [analysisStatus])

  type SuggestionItem = { id: string; text: string; tool: string }
  const remediationFeed = useMemo<SuggestionItem[]>(() => {
    const seen = new Set<string>()
    const list: SuggestionItem[] = []

    toolActivity.forEach((entry) => {
      entry.suggestions.forEach((text, idx) => {
        const key = `${entry.tool}-${text}`
        if (seen.has(key)) return
        seen.add(key)
        list.push({
          id: `${entry.tool}-${idx}`,
          text,
          tool: entry.tool,
        })
      })
    })

    return list
  }, [toolActivity])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (nextFile) {
      setFile(nextFile)
      try {
        const uploadResult = await uploadAPK(nextFile)
        setApkId(uploadResult.apk_id)
      } catch (error) {
        console.error('Upload failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload APK'
        alert(errorMessage)
        // Clear file state on upload failure to maintain consistency
        setFile(null)
        setApkId(null)
      }
    }
  }

  const toggleOption = (optionId: string) => {
    if (optionId === 'jadx') {
      // JADX is recommended but not required
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
      return
    }
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    )
  }

  const handleStartAnalysis = async () => {
    if (!analysisReady || !apkId) return
    setDialogOpen(false)
    setStep('processing')
    setProgress(0)

    try {
      await startAnalysisAPI(apkId, selectedOptions)
    } catch (error) {
      console.error('Failed to start analysis:', error)
      alert('Failed to start analysis. Make sure the backend is running.')
      setStep('idle')
    }
  }

  const resetWorkflow = () => {
    setProgress(0)
    setStep('idle')
    setCurrentTool(null)
    setAnalysisStatus(null)
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 -z-10 w-1/3 bg-[radial-gradient(circle,_rgba(255,255,255,0.05),_transparent_60%)] blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row">
        <aside className="glass-panel sticky top-10 hidden h-[calc(100vh-5rem)] w-64 flex-shrink-0 flex-col rounded-3xl p-6 lg:flex">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            MATS
          </div>
          <nav className="mt-10 space-y-2 text-sm text-muted-foreground">
            {['Overview', 'Upload', 'Analyses', 'Reports', 'Settings'].map((item) => (
              <button
                key={item}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 transition hover:text-foreground',
                  item === 'Upload' && 'bg-primary/10 text-foreground',
                )}
              >
                <span>{item}</span>
                {item === 'Upload' && <ArrowUpRight className="h-4 w-4" />}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-4 text-sm">
            <p className="text-xs uppercase text-primary/70">Workspace health</p>
            <p className="mt-1 text-2xl font-semibold text-primary">98%</p>
            <p className="text-muted-foreground">All services operational</p>
          </div>
        </aside>

        <main className="flex-1 space-y-8 pb-12">
          <header className="glass-panel rounded-3xl p-8 text-center lg:text-left">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-sm uppercase tracking-widest text-primary/70">Mobile Application Threads Simulation</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      apiConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {apiConnected ? "Backend Connected" : "Backend Offline"}
                    </span>
                  </div>
                </div>
                <h1 className="mt-2 text-3xl font-semibold lg:text-4xl">Upload and Analyze Your APK</h1>
                <p className="mt-3 text-base text-muted-foreground">
                  Combine static, dynamic, and runtime tooling in a single guided workflow powered by shadcn/ui.
                </p>
                {!apiConnected && (
                  <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm">
                    <p className="text-red-400 font-medium">⚠️ Backend not connected</p>
                    <p className="text-red-300/80 mt-1 text-xs">
                      Start the backend: <code className="bg-black/30 px-1 rounded">python backend/main.py</code>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Docs
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-white to-gray-300 text-primary-foreground hover:from-gray-200 hover:to-white">
                  <Sparkles className="h-4 w-4" />
                  Auto-remediate
                </Button>
              </div>
            </div>
          </header>

          <section className="glass-panel rounded-3xl p-8">
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Upload</p>
                <h2 className="mt-2 text-2xl font-semibold">Upload and Analyze Your APK</h2>
                <label
                  className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-secondary/30 p-10 text-center transition hover:border-primary/60"
                  htmlFor="apk-input"
                >
                  <Upload className="h-10 w-10 text-primary" />
                  <p className="mt-4 font-mono text-lg tracking-widest text-muted-foreground">upload_file</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop your APK file here or click to browse
                  </p>
                  <input
                    id="apk-input"
                    type="file"
                    accept=".apk"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {file && (
                    <Badge variant="outline" className="mt-4 border-primary/60 bg-primary/5 text-sm text-primary">
                      {file.name}
                    </Badge>
                  )}
                </label>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="min-w-[160px]" disabled={!file}>
                        Analyze
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle className="text-xl font-semibold">Select Analysis Options</DialogTitle>
                      <DialogDescription>
                        Choose one or more tests to run on your application. MobSF is required for baseline coverage.
                      </DialogDescription>
                      <div className="mt-6 space-y-3">
                        {analysisOptions.map((option) => (
                          <div
                            key={option.id}
                            className={cn(
                              'flex items-start justify-between rounded-2xl border border-border/70 p-4',
                              selectedOptions.includes(option.id) && 'border-primary/70 bg-primary/5',
                            )}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-semibold">{option.name}</p>
                                {option.highlight && <Badge className="text-[11px]">{option.highlight}</Badge>}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                            </div>
                            <Checkbox
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={() => toggleOption(option.id)}
                            />
                          </div>
                        ))}
                      </div>
                      <Button className="mt-6 w-full" disabled={!analysisReady} onClick={handleStartAnalysis}>
                        Run Analysis
                      </Button>
                      {!apiConnected && (
                        <p className="mt-2 text-xs text-muted-foreground text-center">
                          ⚠️ Backend not connected. Start with: python backend/main.py
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" className="gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Live device farm
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/60 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Recent Analyses</p>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View all
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-border/40 p-6 text-center text-muted-foreground">
                    <p className="text-sm">No recent analyses</p>
                    <p className="text-xs mt-1">Upload and analyze an APK to see results here</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="rounded-2xl bg-gradient-to-br from-white/15 to-transparent p-4">
                  <p className="text-sm text-primary/80">Need deeper insight?</p>
                  <p className="text-base font-semibold">Export a forensic-ready PDF.</p>
                  <Button variant="outline" className="mt-3 w-full border-primary/50 text-primary">
                    Quick Export
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-border/40 bg-card/60 p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-muted-foreground">Analysis Summary</p>
                <h2 className="text-3xl font-semibold">{file ? `${file.name.replace('.apk', '')}.apk` : 'Your APK'}</h2>
                <p className="text-sm text-muted-foreground">{summaryData?.generatedAt || 'No analysis data available'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Detailed PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Report
                </Button>
              </div>
            </div>

            {step !== 'summary' ? (
              <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                Your results will appear here after the analysis completes. Select your scanners and run the workflow to
                unlock findings, vulnerabilities, and remediation plans.
              </div>
            ) : summaryData ? (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-6">
                  <Card className="glass-panel border-border/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Key Findings
                      </CardTitle>
                      <CardDescription>Automated insights across static, dynamic, and runtime scans.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {summaryData.keyFindings.length > 0 ? (
                        summaryData.keyFindings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-4 rounded-2xl border border-border/50 p-4">
                            <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                            <p className="text-sm text-muted-foreground">{finding}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                          <p className="text-sm">No findings available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-border/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-5 w-5 text-primary" />
                        Vulnerabilities Found
                      </CardTitle>
                      <CardDescription>Prioritized list from analysis tool outputs.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      {summaryData.vulnerabilities.length > 0 ? (
                        summaryData.vulnerabilities.map((vuln, idx) => (
                          <div key={idx} className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                            <Badge
                              variant={vuln.severity === 'critical' ? 'destructive' : vuln.severity === 'high' ? 'warning' : 'outline'}
                              className="text-[11px]"
                            >
                              {vuln.severity.toUpperCase()}
                            </Badge>
                            <p className="mt-3 text-sm font-semibold text-foreground">{vuln.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{vuln.category}</p>
                            <p className="mt-4 text-xs text-muted-foreground">Source · {vuln.scanner}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">
                          <p className="text-sm">No vulnerabilities detected</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-border/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        Remediation Suggestions
                      </CardTitle>
                      <CardDescription>Actionable next steps mapped to MATS knowledge base.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {summaryData.remediation.length > 0 ? (
                        summaryData.remediation.map((item, idx) => (
                          <div key={idx} className="rounded-2xl border border-border/50 p-4">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.action}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                          <p className="text-sm">No remediation suggestions available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="glass-panel border-border/60">
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                      <CardDescription>Composite scoring across all selected scanners.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-border/60 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Severity Score</p>
                        <p className="mt-2 text-4xl font-semibold">{summaryData.metrics.severityScore}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{summaryData.metrics.riskLevel} risk</p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total duration</span>
                          <strong className="text-foreground">{summaryData.metrics.duration}</strong>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Coverage</span>
                          <strong className="text-foreground">{summaryData.metrics.coverage}</strong>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Risk posture</span>
                          <strong className="text-foreground">{summaryData.metrics.riskLevel}</strong>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Analysis stack</p>
                        <Progress value={Number.parseInt(summaryData.metrics.coverage, 10) || 0} />
                        <p className="text-xs text-muted-foreground">
                          Analyzer confidence improves as more baseline scans complete.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                      <Button className="w-full gap-2">
                        <Share2 className="h-4 w-4" />
                        Sync to Jira
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        Open workspace
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="glass-panel border-border/60">
                    <CardHeader>
                      <CardTitle>Activity</CardTitle>
                      <CardDescription>Timeline of automated steps.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ScrollArea className="h-64 pr-2">
                        <div className="space-y-4 text-sm">
                          {toolActivity.length > 0 ? (
                            toolActivity.map((entry) => {
                              const toolName = entry.tool.charAt(0).toUpperCase() + entry.tool.slice(1)
                              const statusBadge =
                                entry.status === 'completed'
                                  ? 'success'
                                  : entry.status === 'pending'
                                    ? 'warning'
                                    : entry.status === 'failed'
                                      ? 'destructive'
                                      : 'outline'

                              return (
                                <div key={entry.tool} className="rounded-2xl border border-border/40 p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-foreground">{toolName}</p>
                                    <Badge variant={statusBadge} className="text-[11px] capitalize">
                                      {entry.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.error || entry.details[0] || 'No output produced'}
                                  </p>
                                  {entry.details.length > 1 && (
                                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                                      {entry.details.slice(1).map((detail, idx) => (
                                        <li key={`${entry.tool}-detail-${idx}`}>{detail}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {entry.threats.length > 0 && (
                                    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                                      <p className="font-semibold mb-2">Quark Threats</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                        {entry.threats.slice(0, 5).map((threat: { id: string; text: string }) => (
                                          <li key={threat.id}>{threat.text}</li>
                                        ))}
                                      </ul>
                                      {entry.threats.length > 5 && <p>+{entry.threats.length - 5} more…</p>}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div className="rounded-2xl border border-dashed border-border/40 p-6 text-center text-muted-foreground">
                              <p className="text-sm">No activity data available</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
                {toolActivity.length > 0 && (
                  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <Card className="glass-panel border-border/60">
                      <CardHeader>
                        <CardTitle>Detailed Tool Output</CardTitle>
                        <CardDescription>Raw results, file locations, and tool-specific notes.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {toolActivity.map((entry) => {
                          const toolName = entry.tool.charAt(0).toUpperCase() + entry.tool.slice(1)
                          const statusBadge =
                            entry.status === 'completed'
                              ? 'success'
                              : entry.status === 'pending'
                                ? 'warning'
                                : entry.status === 'failed'
                                  ? 'destructive'
                                  : 'outline'

                          return (
                            <div key={`detail-${entry.tool}`} className="rounded-2xl border border-border/50 p-4 space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-base font-semibold">{toolName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.error ? 'Stopped with errors' : entry.status === 'completed' ? 'Completed successfully' : entry.status}
                                  </p>
                                </div>
                                <Badge variant={statusBadge} className="text-[11px] capitalize">
                                  {entry.status}
                                </Badge>
                              </div>
                              {entry.details.length > 0 && (
                                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                  {entry.details.map((detail, idx) => (
                                    <li key={`${entry.tool}-detail-block-${idx}`}>{detail}</li>
                                  ))}
                                </ul>
                              )}
                              {entry.error && (
                                <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                                  Error: {entry.error}
                                </p>
                              )}
                              {entry.threats.length > 0 && (
                                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                                  <p className="font-semibold mb-2">Threats</p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {entry.threats.map((threat) => (
                                      <li key={`${entry.tool}-threat-detail-${threat.id}`}>{threat.text}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/60">
                      <CardHeader>
                        <CardTitle>Suggested Next Steps</CardTitle>
                        <CardDescription>Action items generated from scanner output.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {remediationFeed.length > 0 ? (
                          remediationFeed.slice(0, 12).map((item) => (
                            <div key={item.id} className="rounded-2xl border border-border/50 p-3">
                              <p className="text-sm font-semibold">{item.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Source · {item.tool.charAt(0).toUpperCase() + item.tool.slice(1)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                            <p className="text-sm">No remediation suggestions generated</p>
                          </div>
                        )}
                        {remediationFeed.length > 12 && (
                          <p className="text-xs text-muted-foreground text-center">
                            Showing 12 of {remediationFeed.length} suggestions. Export the report for the complete list.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                <p className="text-base">Analysis completed but no results available</p>
                <p className="text-sm mt-2">Check the backend logs for details</p>
              </div>
            )}
          </section>
        </main>
      </div>

      {step === 'processing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <Card className="w-full max-w-lg space-y-6 border-primary/40 p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-semibold">Analysis in Progress</h3>
              <p className="text-sm text-muted-foreground">
                {currentTool ? `Running ${currentTool}...` : 'Preparing analysis...'} {Math.round(progress)}%
              </p>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground">Tip: Regular analyses help identify bottlenecks early.</p>
            <Button variant="ghost" className="w-full border border-border/60" onClick={resetWorkflow}>
              Cancel analysis
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

export default App

