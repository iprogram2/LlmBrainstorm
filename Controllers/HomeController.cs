using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using LlmBrainstorm.Models;
using LlmBrainstorm.Services;

namespace LlmBrainstorm.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly LlmConfigService _configService;

    public HomeController(ILogger<HomeController> logger, LlmConfigService configService)
    {
        _logger = logger;
        _configService = configService;
    }

    public IActionResult Index()
    {
        return View();
    }

    [HttpGet("api/config/{llmName}")]
    public IActionResult GetLlmConfig(string llmName)
    {
        var config = _configService.GetLlmConfig(llmName);
        return Ok(config);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}