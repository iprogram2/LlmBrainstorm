namespace LlmBrainstorm.Models;

public class LlmConfig
{
    public string Name { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
}

public class LlmRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string LlmName { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public bool IsFollowUp { get; set; } = false;
    public string PreviousLlm { get; set; } = string.Empty;
    public string PreviousResponse { get; set; } = string.Empty;
    public string OriginalPrompt { get; set; } = string.Empty;
}

public class LlmResponse
{
    public string Content { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public bool Success => string.IsNullOrEmpty(Error);
}

public class BrainstormSession
{
    public List<string> SelectedLlms { get; set; } = new();
    public List<LlmConfig> LlmConfigs { get; set; } = new();
    public string Prompt { get; set; } = string.Empty;
    public List<BrainstormResponse> Responses { get; set; } = new();
    public bool IsFollowUp { get; set; } = false;
}

public class BrainstormResponse
{
    public string LlmName { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}