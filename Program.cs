using LlmBrainstorm.Models;
using LlmBrainstorm.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddHttpClient();

// Configure LLM API keys from appsettings.json
builder.Services.Configure<LlmApiKeysConfig>(options =>
{
    var section = builder.Configuration.GetSection("LlmApiKeys");
    options.LlmConfigs = new Dictionary<string, LlmModelConfig>();

    foreach (var child in section.GetChildren())
    {
        var config = new LlmModelConfig
        {
            ApiKey = child.GetValue<string>("ApiKey") ?? string.Empty,
            DefaultModel = child.GetValue<string>("DefaultModel") ?? string.Empty
        };

        options.LlmConfigs[child.Key] = config;
    }
});

// Register configuration service
builder.Services.AddSingleton<LlmConfigService>();

// Register LLM services
builder.Services.AddTransient<ChatGptService>();
builder.Services.AddTransient<GeminiService>();
builder.Services.AddTransient<GrokService>();
builder.Services.AddTransient<LlamaService>();
builder.Services.AddTransient<DeepSeekService>();
builder.Services.AddTransient<ClaudeService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();