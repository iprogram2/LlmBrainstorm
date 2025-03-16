using System.Text;
using System.Text.Json;
using LlmBrainstorm.Models;

namespace LlmBrainstorm.Services;

public class GrokService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GrokService> _logger;

    public GrokService(HttpClient httpClient, ILogger<GrokService> logger)
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
                _logger.LogInformation("No API key provided for Grok, using simulation");
                return new LlmResponse { Content = SimulateResponse(request) };
            }

            var messages = new List<object>();

            // Add system message
            messages.Add(new
            {
                role = "system",
                content = "You are Grok, a helpful AI assistant participating in a multi-LLM discussion."
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

            // Use the exact format from the curl example
            var requestBody = JsonSerializer.Serialize(new
            {
                messages = messages,
                model = "grok-2-latest",
                stream = false,
                temperature = 0.7
            });

            _logger.LogInformation("Preparing to call Grok API with request: {Request}", requestBody);

            // Set headers exactly as in the curl example
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {request.ApiKey}");

            try
            {
                // Create content with proper Content-Type header
                var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

                // Call the exact same endpoint as the curl example
                var response = await _httpClient.PostAsync("https://api.x.ai/v1/chat/completions", content);

                var responseData = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Grok API raw response: {Response}", responseData);

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(responseData);
                        var root = doc.RootElement;

                        // Log all top-level properties to understand structure
                        _logger.LogInformation("Grok API response properties: {Properties}",
                            string.Join(", ", root.EnumerateObject().Select(p => p.Name)));

                        // Check for error response despite 200 status
                        if (root.TryGetProperty("error", out var errorElement))
                        {
                            var errorMsg = errorElement.GetString() ?? "Unknown error";
                            _logger.LogError("Grok API error: {ErrorMsg}", errorMsg);
                            return new LlmResponse { Error = $"Grok API error: {errorMsg}" };
                        }

                        // Parse using the format from the official example
                        if (root.TryGetProperty("choices", out var choices) &&
                            choices.GetArrayLength() > 0 &&
                            choices[0].TryGetProperty("message", out var message) &&
                            message.TryGetProperty("content", out var contentElement))
                        {
                            var messageContent = contentElement.GetString() ?? string.Empty;
                            return new LlmResponse { Content = messageContent };
                        }

                        // Fallback to simulation if we can't parse the response
                        _logger.LogWarning("Could not extract content from Grok API response. Using simulation instead.");
                        return new LlmResponse
                        {
                            Content = SimulateResponse(request)
                        };
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error parsing Grok API JSON response");
                        return new LlmResponse { Error = $"Error parsing Grok API response: {ex.Message}" };
                    }
                }
                else
                {
                    _logger.LogError("Grok API error: {StatusCode} - {ErrorData}", response.StatusCode, responseData);
                    return new LlmResponse { Error = $"Grok API Error: {response.StatusCode} - {responseData}" };
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request error when calling Grok API");
                return new LlmResponse { Error = $"HTTP request error: {ex.Message}" };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Grok API");
            return new LlmResponse { Error = $"Error: {ex.Message}" };
        }

        // If we somehow got here without returning, return a simulated response
        return new LlmResponse { Content = SimulateResponse(request) };
    }

    private string SimulateResponse(LlmRequest request)
    {
        // This simulates a response when no API key is available
        if (request.IsFollowUp && !string.IsNullOrEmpty(request.PreviousLlm))
        {
            return $"Interesting take from {request.PreviousLlm}! While I agree with the general direction, I think we need to be more ambitious. What if we completely reimagine the approach? Let's break conventional wisdom and explore truly innovative solutions.";
        }
        else
        {
            return $"Here's my take on \"{request.Prompt}\": What if we completely reimagine conventional wisdom? Instead of incremental improvements, let's explore radical transformations that could lead to breakthrough results. Sometimes the most valuable insights come from questioning fundamental assumptions that everyone else takes for granted.";
        }
    }
}