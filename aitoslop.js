(function() {
    'use strict';
    
    // Prevent multiple executions
    if (window.aiToSlopReplacerLoaded) {
        return;
    }
    window.aiToSlopReplacerLoaded = true;
    
    // Function to check if an element or its parents are editable
    function isEditableElement(element) {
        if (!element) return false;
        
        const tagName = element.tagName?.toLowerCase();
        
        // Check for input fields and other editable elements
        const editableTags = [
            'input', 'textarea', 'select', 'option',
            'button', 'label'
        ];
        
        if (editableTags.includes(tagName)) {
            return true;
        }
        
        // Check for contenteditable
        if (element.contentEditable === 'true' || 
            element.getAttribute('contenteditable') === 'true') {
            return true;
        }
        
        // Check for form elements
        if (element.closest && element.closest('form input, form textarea, form select')) {
            return true;
        }
        
        // Check for elements with editable roles
        const role = element.getAttribute('role');
        if (role && ['textbox', 'searchbox', 'combobox', 'spinbutton'].includes(role)) {
            return true;
        }
        
        // Check if parent is editable (walk up the tree)
        let parent = element.parentElement;
        while (parent) {
            if (parent.contentEditable === 'true' || 
                parent.getAttribute('contenteditable') === 'true') {
                return true;
            }
            
            const parentTag = parent.tagName?.toLowerCase();
            if (editableTags.includes(parentTag)) {
                return true;
            }
            
            parent = parent.parentElement;
        }
        
        return false;
    }
    
    // Function to replace text in a text node
    function replaceTextInNode(textNode) {
        if (textNode.nodeType === Node.TEXT_NODE) {
            // Check if this text node is inside an editable element
            if (isEditableElement(textNode.parentElement)) {
                return false;
            }
            
            const originalText = textNode.textContent;
            let newText = originalText;
            let replacements = 0;
            
            // First: Replace "Apple Intelligence" with "Apple Slop" (case-insensitive, preserve case)
            newText = newText.replace(/\bApple(\s+)Intelligence\b/gi, function(match, whitespace) {
                replacements++;
                // Preserve case of "Apple" and "Intelligence"
                const applePart = match.includes('apple') ? 'apple' : 'Apple';
                const intelligencePart = match.toLowerCase().includes('intelligence') ? 
                    (match.includes('Intelligence') ? 'Slop' : 'slop') : 'Slop';
                return applePart + whitespace + intelligencePart;
            });
            
            // Second: Replace "Artificial Intelligence" with "Slop" (case-insensitive, preserve case)
            newText = newText.replace(/\bArtificial(\s+)Intelligence\b/gi, function(match, whitespace) {
                replacements++;
                // Preserve case based on "Artificial"
                const isCapitalized = match[0] === 'A';
                return isCapitalized ? 'Slop' : 'slop';
            });
            
            // Third: Replace "AI slop" with "slop slop" (case-insensitive)
            newText = newText.replace(/\bAI(\s+)slop\b/gi, function(match, whitespace) {
                replacements++;
                // Preserve the original case of "slop" and whitespace
                const slopPart = match.toLowerCase().includes('slop') ? 
                    (match.includes('Slop') ? 'Slop' : 'slop') : 'slop';
                return 'slop' + whitespace + slopPart;
            });
            
            // Fourth: Replace words starting with "AI" + uppercase + lowercase pattern
            // Example: "AIStor" -> "SlopStor", but not "AIO" or "AIML"
            newText = newText.replace(/\bAI([A-Z][a-z]+\w*)/g, function(match, trailing) {
                replacements++;
                return 'Slop' + trailing;
            });
            
            // Fifth: Replace "A.I." with "Slop" (case-insensitive, preserve case)
            newText = newText.replace(/\bA\.I\./gi, function(match) {
                replacements++;
                // Preserve case based on first letter
                if (match[0] === 'A') return 'Slop';
                if (match[0] === 'a') return 'slop';
                return 'Slop'; // fallback
            });
            
            // Sixth: Replace remaining "AI" with "Slop" (preserve case)
            newText = newText.replace(/\bAI\b/g, function(match) {
                replacements++;
                // Preserve original case
                if (match === 'AI') return 'Slop';
                if (match === 'ai') return 'slop';
                if (match === 'Ai') return 'Slop';
                if (match === 'aI') return 'slop';
                return 'Slop'; // fallback
            });
            
            if (replacements > 0) {
                textNode.textContent = newText;
                return true;
            }
        }
        return false;
    }
    
    // Function to walk through all text nodes in the document
    function replaceTextInAllNodes(rootNode = document.body) {
        if (!rootNode) return 0;
        
        const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style tags
                    const parentElement = node.parentElement;
                    if (!parentElement) return NodeFilter.FILTER_REJECT;
                    
                    const parentTag = parentElement.tagName.toLowerCase();
                    
                    // Skip script, style, and other non-content tags
                    const skipTags = ['script', 'style', 'noscript', 'code', 'pre'];
                    if (skipTags.includes(parentTag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if parent is an editable element
                    if (isEditableElement(parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        
        // Collect all text nodes first to avoid modifying while iterating
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        // Replace text in collected nodes
        let replacementsMade = 0;
        textNodes.forEach(textNode => {
            if (replaceTextInNode(textNode)) {
                replacementsMade++;
            }
        });
        
        return replacementsMade;
    }
    
    // Function to handle dynamically added content
    function observeForChanges() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Don't process if it's an editable element
                        if (!isEditableElement(node)) {
                            replaceTextInAllNodes(node);
                        }
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        // Don't process if parent is editable
                        if (!isEditableElement(node.parentElement)) {
                            replaceTextInNode(node);
                        }
                    }
                });
            });
        });
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        return observer;
    }
    
    // Main execution
    function performReplacements() {
        const replacements = replaceTextInAllNodes();
        console.log(`AI to Slop: Made ${replacements} replacements`);
        
        // Always set up observer for dynamic content
        observeForChanges();
        
        return replacements;
    }
    
    // Start the replacement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performReplacements);
    } else {
        performReplacements();
    }
})();
