// © 2009–2010 EPFL/LAMP
// code by Gilles Dubochet with contributions by Pedro Furlanetto, Marcin Kubala and Felix Mulder

$(document).ready(function() {

    var oldWidth = $("div#subpackage-spacer").width() + 1 + "px";
    $("div#packages > ul > li.current").on("click", function() {
        $("div#subpackage-spacer").css({ "width": oldWidth });
        $("li.current-entities").toggle();
    });

    var controls = {
        visibility: {
            publicFilter: $("#visbl").find("> ol > li.public"),
            protectedFilter: $("#visbl").find("> ol > li.protected"),
            privateFilter: $("#visbl").find("> ol > li.private")
        }
    };

    // Escapes special characters and returns a valid jQuery selector
    function escapeJquery(str){
        return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=<>\|])/g, '\\$1');
    }

    function toggleVisibilityFilter() {
        $(this).toggleClass("in").toggleClass("out");
        filter();
    }

    controls.visibility.publicFilter.on("click", toggleVisibilityFilter);
    controls.visibility.protectedFilter.on("click", toggleVisibilityFilter);
    controls.visibility.privateFilter.on("click", toggleVisibilityFilter);

    function exposeMember(jqElem) {
        var jqElemParent = jqElem.parent(),
            parentName = jqElemParent.attr("name"),
            ancestorName = /^([^#]*)(#.*)?$/gi.exec(parentName)[1];

        // switch visibility filter if necessary
        if (jqElemParent.attr("visbl") == "prt") {
            controls.visibility.privateFilter.removeClass("out").addClass("in");
        }

        // toggle appropriate ancestor filter buttons
        if (ancestorName) {
            $("#filterby li.out[name='" + ancestorName + "']").removeClass("out").addClass("in");
        }

        filter();
        jqElemParent.addClass("selected");
        commentToggleFct(jqElemParent);
        $("#content-scroll-container").animate({scrollTop: $("#content-scroll-container").scrollTop() + jqElemParent.offset().top - $("#search").height() - 23 }, 1000);
    }

    var isHiddenClass = function (name) {
        return name == 'scala.Any' ||
               name == 'scala.AnyRef';
    };

    var isHidden = function (elem) {
        return $(elem).attr("data-hidden") == 'true';
    };

    $("#linearization li").slice(1).filter(function(){
        return isHiddenClass($(this).attr("name"));
    }).removeClass("in").addClass("out");

    $("#implicits li").filter(function(){
        return isHidden(this);
    }).removeClass("in").addClass("out");

    $("#memberfilter > i.arrow").on("click", function() {
        $(this).toggleClass("rotate");
        $("#filterby").toggle();
    });

    // Pre-filter members
    filter();

    // Member filter box
    var input = $("#memberfilter input");
    input.on("keyup", function(event) {

        switch ( event.keyCode ) {

        case 27: // escape key
            input.val("");
            filter(true);
            break;

        case 38: // up
            input.val("");
            filter(false);
            window.scrollTo(0, $("body").offset().top);
            input.trigger("focus");
            break;

        case 33: //page up
            input.val("");
            filter(false);
            break;

        case 34: //page down
            input.val("");
            filter(false);
            break;

        default:
            window.scrollTo(0, $("#mbrsel").offset().top - 130);
            filter(true);
            break;

        }
    });
    input.on("focus", function(event) {
        input.trigger("select");
    });
    $("#memberfilter > .clear").on("click", function() {
        $("#memberfilter input").val("");
        $(this).hide();
        filter();
    });
    $(document).on("keydown", function(event) {
        if (event.keyCode == 9) { // tab
            $("#index-input", window.parent.document).trigger("focus");
            input.val( "");
            return false;
        }
    });

    $("#linearization li").on("click", function(){
        if ($(this).hasClass("in")) {
            $(this).removeClass("in");
            $(this).addClass("out");
        } else if ($(this).hasClass("out")) {
            $(this).removeClass("out");
            $(this).addClass("in");
        }
        filter();
    });

    $("#implicits li").on("click", function(){
        if ($(this).hasClass("in")) {
            $(this).removeClass("in");
            $(this).addClass("out");
        } else if ($(this).hasClass("out")) {
            $(this).removeClass("out");
            $(this).addClass("in");
        }
        filter();
    });

    $("#mbrsel > div > div.ancestors > ol > li.hideall").on("click", function() {
        $("#linearization li.in").removeClass("in").addClass("out");
        $("#linearization li:first").removeClass("out").addClass("in");
        $("#implicits li.in").removeClass("in").addClass("out");

        if ($(this).hasClass("out") && $("#mbrsel > div > div.ancestors > ol > li.showall").hasClass("in")) {
            $(this).removeClass("out").addClass("in");
            $("#mbrsel > div > div.ancestors > ol > li.showall").removeClass("in").addClass("out");
        }

        filter();
    })
    $("#mbrsel > div > div.ancestors > ol > li.showall").on("click", function() {
        var filteredLinearization =
            $("#linearization li.out").filter(function() {
                return ! isHiddenClass($(this).attr("name"));
            });
        filteredLinearization.removeClass("out").addClass("in");

        var filteredImplicits =
            $("#implicits li.out").filter(function() {
                return ! isHidden(this);
            });
        filteredImplicits.removeClass("out").addClass("in");

        if ($(this).hasClass("out") && $("#mbrsel > div > div.ancestors > ol > li.hideall").hasClass("in")) {
            $(this).removeClass("out").addClass("in");
            $("#mbrsel > div > div.ancestors > ol > li.hideall").removeClass("in").addClass("out");
        }

        filter();
    });
    $("#order > ol > li.alpha").on("click", function() {
        if ($(this).hasClass("out"))
            orderAlpha();
    })
    $("#order > ol > li.inherit").on("click", function() {
        if ($(this).hasClass("out"))
            orderInherit();
    });
    $("#order > ol > li.group").on("click", function() {
        if ($(this).hasClass("out"))
            orderGroup();
    });
    $("#groupedMembers").hide();

    initInherit();

    // Create tooltips
    $(".extype").add(".defval").each(function(_,e) {
        var $this = $(e);
        $this.attr("title", $this.attr("name"));
    });

    /* Add toggle arrows */
    $("#template li[fullComment=yes] .modifier_kind").addClass("closed");

    function commentToggleFct(element){
        $("#template li.selected").removeClass("selected");
        if (element.is("[fullcomment=no]")) {
            return;
        }
        element.toggleClass("open");
        var signature = element.find(".modifier_kind")
        var shortComment = element.find(".shortcomment");
        var fullComment = element.find(".fullcomment");
        var vis = $(":visible", fullComment);
        signature.toggleClass("closed").toggleClass("opened");
        if (vis.length > 0) {
            if (!isMobile()) {
                shortComment.slideDown(100);
                fullComment.slideUp(100);
            } else {
                fullComment.hide();
                shortComment.show();
            }
        }
        else {
            if (!isMobile()) {
                shortComment.slideUp(100);
                fullComment.slideDown(100);
            } else {
                shortComment.hide();
                fullComment.show();
            }
        }
    };

    $("#template li[fullComment=yes]").on("click", function() {
        var sel = window.getSelection().toString();
        if (!sel) commentToggleFct($(this));
    });

    /* Linear super types and known subclasses */
    function toggleShowContentFct(e){
      e.toggleClass("open");
      var content = $(".hiddenContent", e);
      if(content.is(':visible')) {
          if (!isMobile()) content.slideUp(100);
          else content.hide();
      } else {
          // TODO: is there a cleaner way to render the svg only once it's visible?
          setTimeout(function() {content.trigger('beforeShow');}, 100);
          if (!isMobile()) content.slideDown(100);
          else content.show();
      }
    };

    $(".toggle").on("click", function() {
      toggleShowContentFct($(this).parent());
      // Stop propagation so that we don't hide/show the parent (this a use case's full sig, which is nested in a member list)
      if ($(this).parent().hasClass("full-signature-block")) return false;
    });

    if ($("#order > ol > li.group").length == 1) { orderGroup(); };

    function findElementByHash(locationHash) {
        var temp = locationHash.replace('#', '');
        var memberSelector = '#' + escapeJquery(temp);
        return $(memberSelector);
    }

    // highlight and jump to selected member if an anchor is provided
    if (window.location.hash) {
        var jqElem = findElementByHash(decodeURIComponent(window.location.hash));
        if (jqElem.length > 0) {
            if (jqElem.hasClass("toggleContainer")) toggleShowContentFct(jqElem);
            else exposeMember(jqElem);
        }
    }

    $("#template span.permalink").on("click", function(e) {
        e.preventDefault();
        var href = $("a", this).attr("href");
        if (href.indexOf("#") != -1) {
            var hash = href.split("#").pop()
            try {
                window.history.pushState({}, "", "#" + hash)
            } catch (e) {
                // fallback for file:// URLs, has worse scrolling behavior
                location.hash = hash;
            }
            exposeMember(findElementByHash(hash))
        }
        return false;
    });

    $("#mbrsel-input").on("input", function() {
        if ($(this).val().length > 0)
            $("#memberfilter > .clear").show();
        else
            $("#memberfilter > .clear").hide();
    });
});

function orderAlpha() {
    $("#order > ol > li.alpha").removeClass("out").addClass("in");
    $("#order > ol > li.inherit").removeClass("in").addClass("out");
    $("#order > ol > li.group").removeClass("in").addClass("out");
    $("#template > div.parent").hide();
    $("#template > div.conversion").hide();
    $("#mbrsel > div.ancestors").show();
    filter();
};

function orderInherit() {
    $("#order > ol > li.inherit").removeClass("out").addClass("in");
    $("#order > ol > li.alpha").removeClass("in").addClass("out");
    $("#order > ol > li.group").removeClass("in").addClass("out");
    $("#template > div.parent").show();
    $("#template > div.conversion").show();
    $("#mbrsel > div.ancestors").hide();
    filter();
};

function orderGroup() {
    $("#order > ol > li.group").removeClass("out").addClass("in");
    $("#order > ol > li.alpha").removeClass("in").addClass("out");
    $("#order > ol > li.inherit").removeClass("in").addClass("out");
    $("#template > div.parent").hide();
    $("#template > div.conversion").hide();
    $("#mbrsel > div.ancestors").show();
    filter();
};

/** Prepares the DOM for inheritance-based display. To do so it will:
  *  - hide all statically-generated parents headings;
  *  - copy all members from the value and type members lists (flat members) to corresponding lists nested below the
  *    parent headings (inheritance-grouped members);
  *  - initialises a control variable used by the filter method to control whether filtering happens on flat members
  *    or on inheritance-grouped members. */
function initInherit() {
    // inheritParents is a map from fully-qualified names to the DOM node of parent headings.
    var inheritParents = new Object();
    var groupParents = new Object();
    $("#inheritedMembers > div.parent").each(function(){
        inheritParents[$(this).attr("name")] = $(this);
    });
    $("#inheritedMembers > div.conversion").each(function(){
        inheritParents[$(this).attr("name")] = $(this);
    });
    $("#groupedMembers > div.group").each(function(){
        groupParents[$(this).attr("name")] = $(this);
    });

    $("#types > ol > li").add("#deprecatedTypes > ol > li").each(function(){
        var mbr = $(this);
        this.mbrText = mbr.find("> .fullcomment .cmt").text();
        var qualName = mbr.attr("name");
        var owner = qualName.slice(0, qualName.indexOf("#"));
        var name = qualName.slice(qualName.indexOf("#") + 1);
        var inheritParent = inheritParents[owner];
        if (inheritParent != undefined) {
            var types = $("> .types > ol", inheritParent);
            if (types.length == 0) {
                inheritParent.append("<div class='types members'><h3>Type Members</h3><ol></ol></div>");
                types = $("> .types > ol", inheritParent);
            }
            var clone = mbr.clone();
            clone[0].mbrText = this.mbrText;
            types.append(clone);
        }
        var group = mbr.attr("group")
        var groupParent = groupParents[group];
        if (groupParent != undefined) {
            var types = $("> .types > ol", groupParent);
            if (types.length == 0) {
                groupParent.append("<div class='types members'><ol></ol></div>");
                types = $("> .types > ol", groupParent);
            }
            var clone = mbr.clone();
            clone[0].mbrText = this.mbrText;
            types.append(clone);
        }
    });

    $(".values > ol > li").each(function(){
        var mbr = $(this);
        this.mbrText = mbr.find("> .fullcomment .cmt").text();
        var qualName = mbr.attr("name");
        var owner = qualName.slice(0, qualName.indexOf("#"));
        var name = qualName.slice(qualName.indexOf("#") + 1);
        var inheritParent = inheritParents[owner];
        if (inheritParent != undefined) {
            var values = $("> .values > ol", inheritParent);
            if (values.length == 0) {
                inheritParent.append("<div class='values members'><h3>Value Members</h3><ol></ol></div>");
                values = $("> .values > ol", inheritParent);
            }
            var clone = mbr.clone();
            clone[0].mbrText = this.mbrText;
            values.append(clone);
        }
        var group = mbr.attr("group")
        var groupParent = groupParents[group];
        if (groupParent != undefined) {
            var values = $("> .values > ol", groupParent);
            if (values.length == 0) {
                groupParent.append("<div class='values members'><ol></ol></div>");
                values = $("> .values > ol", groupParent);
            }
            var clone = mbr.clone();
            clone[0].mbrText = this.mbrText;
            values.append(clone);
        }
    });
    $("#inheritedMembers > div.parent").each(function() {
        if ($("> div.members", this).length == 0) { $(this).remove(); };
    });
    $("#inheritedMembers > div.conversion").each(function() {
        if ($("> div.members", this).length == 0) { $(this).remove(); };
    });
    $("#groupedMembers > div.group").each(function() {
        if ($("> div.members", this).length == 0) { $(this).remove(); };
    });
};

/* filter used to take boolean scrollToMember */
function filter() {
    var query = $.trim($("#memberfilter input").val()).toLowerCase();
    query = query.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&").replace(/\s+/g, "|");
    var queryRegExp = new RegExp(query, "i");

    var publicMembersShown = $("#visbl > ol > li.public").hasClass("in");
    var protectedMembersShown = $("#visbl > ol > li.protected").hasClass("in");
    var privateMembersShown = $("#visbl > ol > li.private").hasClass("in");

    var orderingAlphabetic = $("#order > ol > li.alpha").hasClass("in");
    var orderingInheritance = $("#order > ol > li.inherit").hasClass("in");
    var orderingGroups = $("#order > ol > li.group").hasClass("in");
    var hiddenSuperclassElementsLinearization = orderingInheritance ? $("#linearization > li").slice(1) : $("#linearization > li.out");
    var hiddenSuperclassesLinearization = hiddenSuperclassElementsLinearization.map(function() {
      return $(this).attr("name");
    }).get();
    var hiddenSuperclassElementsImplicits = orderingInheritance ? $("#implicits > li") : $("#implicits > li.out");
    var hiddenSuperclassesImplicits = hiddenSuperclassElementsImplicits.map(function() {
      return $(this).attr("name");
    }).get();

    var hideInheritedMembers;

    if (orderingAlphabetic) {
      $("#allMembers").show();
      $("#inheritedMembers").hide();
      $("#groupedMembers").hide();
      hideInheritedMembers = true;
      $("#allMembers > .members").each(filterFunc);
    } else if (orderingGroups) {
      $("#groupedMembers").show();
      $("#inheritedMembers").hide();
      $("#allMembers").hide();
      hideInheritedMembers = true;
      $("#groupedMembers  > .group > .members").each(filterFunc);
      $("#groupedMembers  > div.group").each(function() {
        $(this).show();
        if ($("> div.members", this).not(":hidden").length == 0) {
            $(this).hide();
        } else {
            $(this).show();
        }
      });
    } else if (orderingInheritance) {
      $("#inheritedMembers").show();
      $("#groupedMembers").hide();
      $("#allMembers").hide();
      hideInheritedMembers = false;
      $("#inheritedMembers > .parent > .members").each(filterFunc);
      $("#inheritedMembers > .conversion > .members").each(filterFunc);
    }


    function filterFunc() {
      var membersVisible = false;
      var members = $(this);
      members.find("> ol > li").each(function() {
        var mbr = $(this);
        var visibility = mbr.attr("visbl");
        if (!publicMembersShown && visibility == "pub") {
          mbr.hide();
          return;
        }
        if (!protectedMembersShown && visibility == "prt") {
          mbr.hide();
          return;
        }
        if (!privateMembersShown && visibility == "prv") {
          mbr.hide();
          return;
        }
        var name = mbr.attr("name");
        // Owner filtering must not happen in "inherited from" member lists
        if (hideInheritedMembers) {
          var ownerIndex = name.indexOf("#");
          if (ownerIndex < 0) {
            ownerIndex = name.lastIndexOf(".");
          }
          var owner = name.slice(0, ownerIndex);
          for (var i = 0; i < hiddenSuperclassesLinearization.length; i++) {
            if (hiddenSuperclassesLinearization[i] == owner) {
              mbr.hide();
              return;
            }
          };
          for (var i = 0; i < hiddenSuperclassesImplicits.length; i++) {
            if (hiddenSuperclassesImplicits[i] == owner) {
              mbr.hide();
              return;
            }
          };
        }
        if (query && !(queryRegExp.test(name) || queryRegExp.test(this.mbrText))) {
          mbr.hide();
          return;
        }
        mbr.show();
        membersVisible = true;
      });

      if (membersVisible)
          members.show();
      else
          members.hide();
    };

    return false;
};

/** Check if user agent is associated with a known mobile browser */
function isMobile() {
    return /Android|webOS|Mobi|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* Dynamically injected post-processing code for the API docs */

/* global $, MathJax */

$(document).ready(function() {
  var annotations = $("dt:contains('Annotations')").next("dd").children("span.name");
  addBadges(annotations, "AlphaComponent", ":: AlphaComponent ::", '<span class="alphaComponent badge">Alpha Component</span>');
  addBadges(annotations, "DeveloperApi", ":: DeveloperApi ::", '<span class="developer badge">Developer API</span>');
  addBadges(annotations, "Experimental", ":: Experimental ::", '<span class="experimental badge">Experimental</span>');
});

function addBadges(allAnnotations, name, tag, html) {
  var annotations = allAnnotations.filter(":contains('" + name + "')")
  var tags = $(".cmt:contains(" + tag + ")")

  // Remove identifier tags from comments
  tags.each(function(_ignored_index) {
    var oldHTML = $(this).html();
    var newHTML = oldHTML.replace(tag, "");
    $(this).html(newHTML);
  });

  // Add badges to all containers
  tags.prevAll("h4.signature")
    .add(annotations.closest("div.fullcommenttop"))
    .add(annotations.closest("div.fullcomment").prevAll("h4.signature"))
    .prepend(html);
}

$(document).ready(function() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.onload = function(){
    MathJax.Hub.Config({
      displayAlign: "left",
      tex2jax: {
        inlineMath: [ ["$", "$"], ["\\(","\\)"] ],
        displayMath: [ ["$$","$$"], ["\\[", "\\]"] ],
        processEscapes: true,
        skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'a']
      }
    });
  };
  script.src = ('https:' == document.location.protocol ? 'https://' : 'http://') +
                'cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js' +
                '?config=TeX-AMS-MML_HTMLorMML';
  document.getElementsByTagName('head')[0].appendChild(script);
});
