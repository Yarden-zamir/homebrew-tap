# typed: false
# frozen_string_literal: true

class GhSource < Formula
  desc "Plugin manager for people who don't like plugin managers"
  homepage "https://github.com/Yarden-zamir/gh-source"
  url "https://github.com/Yarden-zamir/gh-source/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "6f933f5db65695786ae0dcd773a7a59ef8de48fda57a6efdc08e9694ae9d9528"
  license "MIT"

  depends_on "gh"

  def install
    pkgshare.install "gh-source.zsh"
    pkgshare.install "zsh-completion"
  end

  def caveats
    <<~EOS
      To activate gh-source, add the following at the end of your .zshrc:
        source #{opt_pkgshare}/gh-source.zsh
    EOS
  end

  test do
    assert_match "Usage:", shell_output("zsh -fc 'source #{pkgshare}/gh-source.zsh; gh_source --help'")
  end
end
