using Microsoft.AspNetCore.Mvc;
using LlmBrainstorm.Models;
using LlmBrainstorm.Services;

namespace LlmBrainstorm.Controllers;

[Route("api")]
[ApiController]
public class ApiController : ControllerBase
{
    private readonly ChatGptService _chatGptService;
    private readonly GeminiService _geminiService;
    private readonly GrokService _grokService;
    private readonly LlamaService _llamaService;
    private readonly DeepSeekService _deepSeekService;
    private readonly ClaudeService _claudeService;
    private readonly ILogger<ApiController> _logger;

    public ApiController(
        ChatGptService chatGptService,
        GeminiService geminiService,
        GrokService grokService,
        LlamaService llamaService,
        DeepSeekService deepSeekService,
        ClaudeService claudeService,
        ILogger<ApiController> logger)
    {
        _chatGptService = chatGptService;
        _geminiService = geminiService;
        _grokService = grokService;
        _llamaService = llamaService;
        _deepSeekService = deepSeekService;
        _claudeService = claudeService;
        _logger = logger;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] LlmRequest request)
    {
        _logger.LogInformation("Received request for LLM: {LlmName}", request.LlmName);

        LlmResponse response = request.LlmName.ToLower() switch
        {
            "chatgpt" => await _chatGptService.GetResponseAsync(request),
            "gemini" => await _geminiService.GetResponseAsync(request),
            "grok" => await _grokService.GetResponseAsync(request),
            "llama" => await _llamaService.GetResponseAsync(request),
            "deepseek" => await _deepSeekService.GetResponseAsync(request),
            "claude" => await _claudeService.GetResponseAsync(request),
            _ => new LlmResponse { Error = $"Unknown LLM: {request.LlmName}" }
        };

        if (!response.Success)
        {
            _logger.LogError("Error from {LlmName}: {Error}", request.LlmName, response.Error);
            return BadRequest(response);
        }

        _logger.LogInformation("Successful response from {LlmName}", request.LlmName);
        return Ok(response);
    }
}