// Add conversation state visualization to the page
function initializeConversationState() {
    // Create the conversation state container if it doesn't exist
    if ($('.conversation-state').length === 0) {
        const stateContainer = $('<div class="conversation-state mb-3"></div>');
        $('#response-area').before(stateContainer);
    }
    
    // Clear existing status indicators
    $('.conversation-state').empty();
    
    // Get active LLMs
    const activeLLMs = getActiveLLMs();
    
    // Add status indicator for each active LLM
    activeLLMs.forEach(llm => {
        const statusElement = $(`<div class="llm-status" data-llm="${llm}">
            <span class="llm-icon" style="background-color: ${getLLMColor(llm)}">
                ${llm.charAt(0)}
            </span>
            <span class="llm-name">${llm}</span>
            <span class="status-text waiting"><i class="fas fa-clock"></i> Waiting</span>
        </div>`);
        
        $('.conversation-state').append(statusElement);
    });
}

// Fix for LLM progress indicators
function fixLLMProgressIndicators() {
    // Force reset all LLM status indicators
    const activeLLMs = getActiveLLMs();
    activeLLMs.forEach(llm => {
        updateLLMStatus(llm, 'waiting');
    });
    
    // Override the original updateLLMStatus function to ensure it works properly
    window.originalUpdateLLMStatus = window.updateLLMStatus;
    window.updateLLMStatus = function(llm, status) {
        console.log(`Updating status for ${llm} to ${status}`);
        const statusElement = $(`.llm-status[data-llm="${llm}"]`);
        
        if (statusElement.length === 0) {
            console.warn(`Status element for ${llm} not found`);
            return;
        }
        
        // Remove all status classes
        statusElement.removeClass('thinking completed waiting error');
        
        // Add appropriate class and update icon
        switch(status) {
            case 'thinking':
                statusElement.addClass('thinking');
                statusElement.find('.status-text').html('<i class="fas fa-spinner fa-spin"></i> Thinking...');
                break;
            case 'completed':
                statusElement.addClass('completed');
                statusElement.find('.status-text').html('<i class="fas fa-check-circle"></i> Completed');
                break;
            case 'waiting':
                statusElement.addClass('waiting');
                statusElement.find('.status-text').html('<i class="fas fa-clock"></i> Waiting');
                break;
            case 'error':
                statusElement.addClass('error');
                statusElement.find('.status-text').html('<i class="fas fa-exclamation-circle"></i> Error');
                break;
        }
    };
    
    // Add special handling for all LLMs
    $(document).on('DOMNodeInserted', '.response-card', function() {
        // Get the LLM name from the response card
        const llmName = $(this).find('.llm-name').text().trim();
        if (llmName) {
            // Ensure LLM status is updated to completed
            updateLLMStatus(llmName, 'completed');
        }
    });
    
    // Fix for Gemini specifically
    const originalCallLLMApi = window.callLLMApi;
    window.callLLMApi = function(llm, prompt, round) {
        // Update status to thinking
        updateLLMStatus(llm, 'thinking');
        
        // Call original function
        return originalCallLLMApi(llm, prompt, round)
            .then(response => {
                // Update status to completed
                updateLLMStatus(llm, 'completed');
                return response;
            })
            .catch(error => {
                // Update status to error
                updateLLMStatus(llm, 'error');
                throw error;
            });
    };
}

// Get color for LLM
function getLLMColor(llm) {
    const colors = {
        'ChatGPT': '#10a37f',
        'Gemini': '#1a73e8',
        'Grok': '#ff6b6b',
        'Llama': '#8e44ad',
        'DeepSeek': '#3498db',
        'Claude': '#6366f1'
    };
    
    return colors[llm] || '#6c757d';
}

// Update the existing document ready function
$(document).ready(function() {
    // Initialize conversation state on page load
    initializeConversationState();
    
    // Apply fix for LLM progress indicators
    fixLLMProgressIndicators();
    
    // Make Active LLMs section collapsible
    $('.collapsible-header').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next('.collapsible-content').toggleClass('collapsed');
    });
    
    // Ensure Active LLMs section is expanded by default
    $('.card-header.collapsible-header').first().removeClass('collapsed');
    $('.card-body.collapsible-content').first().removeClass('collapsed');
});
