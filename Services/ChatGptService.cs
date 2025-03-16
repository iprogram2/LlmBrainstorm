using System.Text;
using System.Text.Json;
using LlmBrainstorm.Models;

namespace LlmBrainstorm.Services;

public class ChatGptService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ChatGptService> _logger;

    public ChatGptService(HttpClient httpClient, ILogger<ChatGptService> logger)
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

            var messages = new List<object>();

            // Add system message
            messages.Add(new
            {
                role = "system",
                content = "You are a helpful assistant participating in a multi-LLM discussion."
            });

            // Add user message
            if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm) && !string.IsNullOrEmpty(request.PreviousResponse))
            {
                messages.Add(new
                {
                    role = "user",
                    content = $"{request.PreviousLlm}'s response to \"{request.OriginalPrompt}\" was: \"{request.PreviousResponse}\"\n\nWhat do you think about this?"
                });
            }
            else
            {
                messages.Add(new
                {
                    role = "user",
                    content = request.Prompt
                });
            }

            var requestBody = JsonSerializer.Serialize(new
            {
                model = request.Model,
                messages,
                max_tokens = 500
            });

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {request.ApiKey}");

            var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var responseData = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseData);

                var messageContent = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? string.Empty;

                return new LlmResponse { Content = messageContent };
            }
            else
            {
                var errorData = await response.Content.ReadAsStringAsync();
                _logger.LogError("ChatGPT API error: {ErrorData}", errorData);
                return new LlmResponse { Error = $"ChatGPT API Error: {response.StatusCode} - {errorData}" };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling ChatGPT API");
            return new LlmResponse { Error = $"Error: {ex.Message}" };
        }
    }

    private string SimulateResponse(LlmRequest request)
    {
        // This simulates a response when no API key is available
        if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm))
        {
            return $"I appreciate {request.PreviousLlm}'s perspective. Building on their points, I would add that we should also consider practical implementation details and potential edge cases. A structured approach with clear metrics for success would be beneficial.";
        }
        else
        {
            return $"To address \"{request.Prompt}\", we should consider a structured approach that examines the problem from multiple angles. First, let's define the core issues and then explore potential solutions based on existing research and best practices. A systematic evaluation of alternatives would help identify the most effective path forward.";
        }
    }
}