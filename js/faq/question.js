function Question(faqID, jsonData_Level_questionID) {
    // Fake Constructor (also properties define ???)
    this.ID = faqID;
    // Begin parse the info
    this.text = jsonData_Level_questionID.text;

    if (jsonData_Level_questionID.content) {
        if (jsonData_Level_questionID.content.markdown) {
            this.content = window.markdownEngine.makeHtml(jsonData_Level_questionID.content.markdown);
        } else if (jsonData_Level_questionID.content.html) {
            this.content = jsonData_Level_questionID.content.html;
        } else if (jsonData_Level_questionID.content.url) {
            if (jsonData_Level_questionID.content.url.link) {
                this.url = jsonData_Level_questionID.content.url.link;

                if (jsonData_Level_questionID.content.url.type) {
                    this.contentType = jsonData_Level_questionID.content.url.type;
                } else {
                    this.contentType = "markdown";
                }
            }
        }
    }

    return this;
};

var recursiveGetParent = function thisfunction(target) {
    if (target.parentQ) {
        return thisfunction(target.parentQ);
    } else {
        return target;
    }
}

Question.prototype.GetRoot = function() {
    return window.recursiveGetParent(this);
}

Question.prototype.AppendNestedQuestion = function(id, object_question, nestedCallback) {
    if (!this.nestQ)
        this.nestQ = {};
    this.nestQ[id] = object_question;

    return this;
};

var ParseQuestion = function thisfunction(id, jsonData_Level_questionID, nestedCallback) {
    var result = new Question(id, jsonData_Level_questionID);

    // Begin nested question read
    if (jsonData_Level_questionID.small_questions) {
        for (var faqID in jsonData_Level_questionID.small_questions) {
            if (jsonData_Level_questionID.small_questions.hasOwnProperty(faqID)) {
                var lawghaliwgh = thisfunction(faqID, jsonData_Level_questionID.small_questions[faqID], nestedCallback);
                result.AppendNestedQuestion(faqID, lawghaliwgh, nestedCallback);
                lawghaliwgh.parentQ = result;
            }
        }
    }

    var root = window.recursiveGetParent(result);
    if (root) {
        if (typeof nestedCallback === "function")
            nestedCallback(result, root);
    }

    return result;
};

// GetContent(callback: method(content:string)) method: Fetch the answer content and invoke callback once the fetch is done.
Question.prototype.GetContent = function(callback) {
    if (typeof callback !== "function") return;
    if (this.content)
        callback(this.content);
    else {
        if (!this.url) {
            callback("");
        } else {
            var self = this;
            $.ajax({
                    url: this.url,
                    cache: false,
                    dataType: this.contentType === "markdown" ? "text" : "html"
                })
                .done(function(data) {
                    if (!data) callback("");
                    if (self.contentType === "markdown") {
                        self.content = window.markdownEngine.makeHtml(data);
                    } else {
                        self.content = data;
                    }
                    callback(self.content);
                })
                .fail(function() {
                    callback(null);
                });
        }
    }
    return this;
};

var nestedSectionCreate = function thisfunction(currentLi, currentItem) {

    var createdLi = $("<li>").addClass("no-bulleting").append(
            $("<a>").attr("id", currentItem.ID).attr("href", "#").addClass("section-font").append($("<p>").addClass("section-child-text").text(currentItem.text)).click(function(e) {
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
                    window.SetUrlHash(highlight);
                });
                // ShowFAQContent(self.attr('id'));
            })
        ),
        createdUl = $("<ul>").append(createdLi);

    if (currentItem.nestQ)
        for (var id in currentItem.nestQ)
            if (currentItem.nestQ.hasOwnProperty(id))
                thisfunction(createdLi, currentItem.nestQ[id]);

    currentLi.append(createdUl);
}

Question.prototype.RenderSection = function(callback) {
    if (typeof callback !== "function") return;
    if (this.r_section)
        callback(this.r_section);

    /*<li>
        <a>Sections:</a>
    </li>*/

    var mainLi = $("<li>").append(
        $("<a>").attr("id", this.ID).attr("href", "#").addClass("section-main-font").append($("<p>").addClass("section-main-text").text(this.text)).click(function(e) {
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
                window.SetUrlHash(highlight);
            });
            // ShowFAQContent(self.attr('id'));
        })
    );

    // Try insight ???


    // Begin nested render the section
    if (this.nestQ) {
        for (var id in this.nestQ)
            if (this.nestQ.hasOwnProperty(id))
                window.nestedSectionCreate(mainLi, this.nestQ[id]);
    }
    this.r_section = mainLi;

    callback(this.r_section);
}

var GetLoadOrder = function thisfunction(root, order) {
    if (root.content) {
        // list[root.ID] = root;
        order.push(root);
    } else if (root.url) {
        // list[root.ID] = root;
        order.push(root);
    }

    // Begin nested question read

    if (root.nestQ) {
        for (var faqID in root.nestQ) {
            if (root.nestQ.hasOwnProperty(faqID)) {
                thisfunction(root.nestQ[faqID], order);
            }
        }
    }
};

function ContentBuilder(root) {
    // Get nested order
    // this.orderList = {};
    this.keyList = [];
    window.GetLoadOrder(root, this.keyList);
    this.index = -1;
    this.content = "";

    this.innerbuild = function thisfunction(context, callback) {
        if (typeof callback !== "function") return;
        context.index++;
        if (context.index >= context.keyList.length) {
            callback(context.content);
            return;
        } else {
            context.keyList[context.index].GetContent(function(_content) {
                if (_content) {
                    if (context.keyList[context.index].text)
                        context.content = context.content +
                        "<div id=\"" + context.keyList[context.index].ID + "\">" +
                        "<h1>" + context.keyList[context.index].text + "</h1>" + // Header
                        _content + // Content
                        "</div>";
                    else
                        context.content = context.content + _content;
                    thisfunction(context, callback);
                }
            });
        }
    }

    this.Build = function(callback) {
        this.innerbuild(this, callback);
    }
}

var innerRenderContent = function thisfunction(target, callback) {
    if (typeof callback !== "function") return;

    if (this.parentQ) {
        var root = this.GetRoot();
        thisfunction(root, callback);
    } else {
        if (target.r_content)
            callback(target.r_content);

        var builder = new ContentBuilder(target);
        builder.Build(function(content) {
            target.r_content = content;
            callback(content);
        });

    }
}

Question.prototype.RenderContent = function thisfunction(callback) {
    if (typeof callback !== "function") return;

    window.innerRenderContent(this, callback);

    /*if (this.parentQ) {
        var root = this.GetRoot();
        root.RenderContent(callback);
    } else {
        if (this.r_content)
            callback(this.r_content);
        var self = this;
        var builder = new ContentBuilder(self);
        builder.Build(function(content) {
            self.r_content = content;
            callback(content);
        });
    };//*/
}