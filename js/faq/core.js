var elementLastAdded;
var markdownEngine = new showdown.Converter({ extensions: ['youtube'] });

function AddToSection(text, id) {
    if (window.elementLastAdded === undefined)
        window.elementLastAdded = $("#insertAfterStart");

    if (typeof text !== "object") {
        var newElement = $("<li>").append(
            $("<a>").text(text).addClass("section-font").attr("id", id).click(function(e) {
                e.preventDefault();
                var self = $(this);
                if (self.hasClass("activated")) return;
                $("#sectionList").find(".activated").removeClass("activated");
                self.addClass("activated");
                window.Controller.GetContentRender(self.attr("id"), function(r_content, redrawn, highlight) {
                    if (redrawn)
                        window.showFAQContent(r_content);
                    else {
                        var something = $("#" + highlight);
                        if (something)
                            window.scrolltopos(something);
                    }
                });
                // ShowFAQContent(self.attr('id'));
            })
        );

    } else {
        var newElement = text;
    }
    newElement.insertAfter(window.elementLastAdded);
    window.elementLastAdded = newElement;
}

function scrolltopos(target) {
    $(window).animate({ scrollTop: $(window).scrollTop() + (target.offset().top - $(window).offset().top) });
}

function showFAQContent(htmlcontent) {
    var targetDOM = $("#pagecontent");
    // Remove the current FAQ Content.
    targetDOM.empty();

    if (!htmlcontent) {
        //everything-center
        targetDOM.append($("<div>").addClass("everything-center animated fadeInDown").html(CONFIG.HOMEPAGE_HTML));
        window.Controller.currentviewing = null;
    } else {
        // Fetch the FAQ content
        targetDOM.append($("<div>").addClass("animated fadeInLeft").html(htmlcontent));
        /*window.Controller.GetFAQInfo(id, function(content) {
            targetDOM.append($("<div>").addClass("animated fadeInRight").html('<h1>' + info.text + '</h1>' + info.content));
        });*/
    }
}

function GetErrorMessage() {
    return "<p><span class=\"text-red\">Error while requesting FAQ content.</span></p>";
}

var Controller = new function() {
    // var downloadedfaqs, loadedfaqs;
    this.currentviewing = null;

    this.GetFAQInfo = function(id, callback) {
        if (typeof callback !== "function") {
            this.loadedfaqs[id].GetContent(callback);
        }
    }

    this.GetRootFromCache = function(id) {
        if (this.faqlocationcache)
            return this.faqlocationcache[id];
        else
            return null;
    }

    /// id: [In]. This is the ID of the section
    /// callback: callback method. function(r_section : string, redrawn : bool)
    this.GetContentRender = function(id, callback) {
        if (typeof callback !== "function") return;
        var targetRoot = this.GetRootFromCache(id);

        if (this.currentviewing === targetRoot) {
            callback("", false, id);
        } else {
            this.currentviewing = targetRoot;
            targetRoot.RenderContent(function(content) {
                if (typeof content === "string") {
                    if (!content)
                        callback(markdownEngine.makeHtml("# In building"), true, id);
                    else {
                        callback(content, true, id);
                    }
                } else {
                    callback(window.GetErrorMessage(), true, id);
                }
            });
        }
    }

    /// id: [In]. This is the ID of the section
    /// callback: callback method. function(r_section : string)
    this.GetSectionRender = function(id, callback) {
        if (typeof callback === "function") {
            this.loadedfaqs[id].RenderSection(callback);
        }
    }

    this.RequestFAQContent = function(callback) {
        if (typeof callback !== "function") return;
        if (this.loadedfaqs) {
            callback(this.loadedfaqs);
            return;
        }
        $.ajax({
                url: CONFIG.FAQSOURCE,
                cache: false,
                dataType: "json",
                context: this
            })
            .done(function(data) {
                if (data) {
                    var self = this;
                    self.downloadedfaqs = data;
                    self.loadedfaqs = {};
                    self.faqlocationcache = {};
                    for (var faqID in data.faqs)
                        if (data.faqs.hasOwnProperty(faqID))
                            self.loadedfaqs[faqID] = ParseQuestion(faqID, data.faqs[faqID], function nestedReading(currentQ, rootQ) {
                                self.faqlocationcache[currentQ.ID] = rootQ;
                                console.log(currentQ);
                                console.log(rootQ);
                            });
                }
                callback(data);
            })
            .fail(function() {
                callback(null);
            });
    }
}

$(function() {
    $("a#linkToHome").click(function(e) {
        e.preventDefault();
        var self = $(this);
        if (self.hasClass("activated")) return;
        $("#sectionList").find(".activated").removeClass("activated");
        self.addClass("activated");
        window.showFAQContent(null);
    });

    var homelink = $("a#linkToHome");
    homelink.text(CONFIG.SITENAME);
    homelink.click();
    $("#wrapper").addClass("toggled");

    window.Controller.RequestFAQContent(function(content) {
        if (content && content.faqs)
            for (var faqID in content.faqs)
                if (content.faqs.hasOwnProperty(faqID))
                    window.Controller.GetSectionRender(faqID, function(r_section) {
                        window.AddToSection(r_section, faqID);
                    });
    });
});