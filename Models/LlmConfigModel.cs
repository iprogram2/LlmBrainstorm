namespace LlmBrainstorm.Models;

public class LlmApiKeysConfig
{
    public Dictionary<string, LlmModelConfig> LlmConfigs { get; set; } = new();
}

public class LlmModelConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string DefaultModel { get; set; } = string.Empty;
}