using System.Text;
using System.Text.Json;
using LlmBrainstorm.Models;

namespace LlmBrainstorm.Services;

public class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(HttpClient httpClient, ILogger<GeminiService> logger)
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

            // Use the suggested model directly based on the error message
            // "gemini-1.5-flash" is the recommended replacement for "gemini-pro"
            string modelName = "models/gemini-1.5-flash";

            // Allow overriding the model if specified and different from the deprecated one
            if (!string.IsNullOrEmpty(request.Model) && request.Model != "gemini-pro")
            {
                modelName = $"models/{request.Model}";
            }

            _logger.LogInformation("Using Gemini model: {ModelName}", modelName);

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
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = content } } }
                },
                generationConfig = new
                {
                    maxOutputTokens = 800,
                    temperature = 0.7
                }
            });

            // Updated URL format with the correct model
            var url = $"https://generativelanguage.googleapis.com/v1/{modelName}:generateContent?key={request.ApiKey}";

            _logger.LogInformation("Calling Gemini API with URL: {Url}", url);

            var stringContent = new StringContent(requestBody, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, stringContent);

            if (response.IsSuccessStatusCode)
            {
                var responseData = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("Gemini API response: {Response}", responseData);

                using var doc = JsonDocument.Parse(responseData);

                var messageContent = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? string.Empty;

                return new LlmResponse { Content = messageContent };
            }
            else
            {
                var errorData = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error: {ErrorData}", errorData);

                // Try to extract more helpful error information
                try
                {
                    using var doc = JsonDocument.Parse(errorData);
                    var errorMessage = doc.RootElement
                        .GetProperty("error")
                        .GetProperty("message")
                        .GetString();

                    return new LlmResponse { Error = $"Gemini API Error: {errorMessage}" };
                }
                catch
                {
                    return new LlmResponse { Error = $"Gemini API Error: {response.StatusCode} - {errorData}" };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API");
            return new LlmResponse { Error = $"Error: {ex.Message}" };
        }
    }

    private string SimulateResponse(LlmRequest request)
    {
        // This simulates a response when no API key is available
        if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm))
        {
            return $"{request.PreviousLlm} raised some good points. I'd like to explore this further by examining the underlying patterns and connections. Perhaps we could integrate cutting-edge research in this domain to develop a more comprehensive solution.";
        }
        else
        {
            return $"\"{request.Prompt}\" is a fascinating topic that intersects with multiple domains. I think we need to start by understanding the underlying principles and then develop innovative strategies that leverage cutting-edge technologies and methodologies. By connecting seemingly disparate concepts, we might discover novel approaches to this challenge.";
        }
    }
}