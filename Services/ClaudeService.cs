using System.Text;
using System.Text.Json;
using LlmBrainstorm.Models;

namespace LlmBrainstorm.Services;

public class ClaudeService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ClaudeService> _logger;

    public ClaudeService(HttpClient httpClient, ILogger<ClaudeService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<LlmResponse> GetResponseAsync(LlmRequest request)
    {
        try
        {
            // If API key is not provided, return simulated response
            if (string.IsNullOrEmpty(request.ApiKey))
            {
                return new LlmResponse { Content = SimulateResponse(request) };
            }

            string content;

            if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm) && !string.IsNullOrEmpty(request.PreviousResponse))
            {
                content = $"{request.PreviousLlm}'s response to \"{request.OriginalPrompt}\" was: \"{request.PreviousResponse}\"\n\nWhat do you think about this?";
            }
            else
            {
                content = request.Prompt;
            }

            var requestBody = JsonSerializer.Serialize(new
            {
                model = request.Model,
                max_tokens = 800,
                messages = new[]
                {
                    new { role = "user", content = content }
                }
            });

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-api-key", request.ApiKey);
            _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var stringContent = new StringContent(requestBody, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.anthropic.com/v1/messages", stringContent);

            if (response.IsSuccessStatusCode)
            {
                var responseData = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseData);

                var messageContent = doc.RootElement
                    .GetProperty("content")[0]
                    .GetProperty("text")
                    .GetString() ?? string.Empty;

                return new LlmResponse { Content = messageContent };
            }
            else
            {
                var errorData = await response.Content.ReadAsStringAsync();
                _logger.LogError("Claude API error: {ErrorData}", errorData);
                return new LlmResponse { Error = $"Claude API Error: {response.StatusCode} - {errorData}" };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Claude API");
            return new LlmResponse { Error = $"Error: {ex.Message}" };
        }
    }

    private string SimulateResponse(LlmRequest request)
    {
        // This simulates a response when no API key is available
        if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm))
        {
            return $"I find {request.PreviousLlm}'s reasoning thoughtful. To complement their approach, I'd suggest we also examine historical precedents and ethical considerations. It's important to balance innovation with responsible implementation.";
        }
        else
        {
            return $"When considering \"{request.Prompt}\", it's important to balance innovation with ethical considerations and practical constraints. I suggest we explore this topic through multiple lenses—historical context, current best practices, and emerging trends—to develop a nuanced understanding that can inform thoughtful action.";
        }
    }
}