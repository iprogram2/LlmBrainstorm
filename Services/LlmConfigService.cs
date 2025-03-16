using LlmBrainstorm.Models;
using Microsoft.Extensions.Options;

namespace LlmBrainstorm.Services;

public class LlmConfigService
{
    private readonly LlmApiKeysConfig _config;
    private readonly ILogger<LlmConfigService> _logger;

    public LlmConfigService(IOptions<LlmApiKeysConfig> config, ILogger<LlmConfigService> logger)
    {
        _config = config.Value;
        _logger = logger;
    }

    public LlmConfigDto GetLlmConfig(string llmName)
    {
        if (_config.LlmConfigs.TryGetValue(llmName, out var config))
        {
            return new LlmConfigDto
            {
                ApiKey = config.ApiKey,
                DefaultModel = config.DefaultModel,
                // Report if there's a key, but don't auto-enable
                HasConfiguredKey = !string.IsNullOrEmpty(config.ApiKey) && config.ApiKey != "YOUR_OPENAI_API_KEY_HERE"
            };
        }

        return new LlmConfigDto
        {
            ApiKey = string.Empty,
            DefaultModel = GetDefaultModelForLlm(llmName),
            HasConfiguredKey = false
        };
    }

    private string GetDefaultModelForLlm(string llmName)
    {
        return llmName switch
        {
            "ChatGPT" => "gpt-4o",
            "Gemini" => "gemini-1.5-flash", // Updated to the newer model
            "Grok" => "grok-1",
            "Llama" => "llama-3.1-70b",
            "DeepSeek" => "deepseek-chat",
            "Claude" => "claude-3-opus-20240229",
            _ => string.Empty
        };
    }
}

public class LlmConfigDto
{
    public string ApiKey { get; set; } = string.Empty;
    public string DefaultModel { get; set; } = string.Empty;
    public bool HasConfiguredKey { get; set; } = false;
}